"""Observability, drift, and illustrative FinOps figures."""

from __future__ import annotations

import math

from sqlalchemy import select
from sqlalchemy.orm import Session

from decidion_api.engine.evaluators import evaluator_catalog
from decidion_api.models import Agent, Decision, Escalation, KillSwitch


def recent_block_rate(db: Session, agent_id: str, limit: int = 20) -> float:
    rows = db.scalars(
        select(Decision)
        .where(Decision.agent_id == agent_id, Decision.sandbox.is_(False))
        .order_by(Decision.created_at.desc())
        .limit(limit)
    ).all()
    if not rows:
        return 0.0
    blocked = sum(1 for row in rows if row.outcome == "BLOCK")
    return blocked / len(rows)


def _percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return float(ordered[0])
    rank = (len(ordered) - 1) * p
    low = math.floor(rank)
    high = math.ceil(rank)
    if low == high:
        return float(ordered[int(rank)])
    weight = rank - low
    return float(ordered[low] * (1 - weight) + ordered[high] * weight)


def snapshot(db: Session) -> dict:
    agents = db.scalars(select(Agent)).all()
    decisions = db.scalars(select(Decision).where(Decision.sandbox.is_(False))).all()
    escalations = db.scalars(select(Escalation)).all()
    switches = db.scalars(select(KillSwitch)).all()
    counts = {"ALLOW": 0, "ESCALATE": 0, "BLOCK": 0}
    hourly: dict[str, dict[str, int]] = {}
    latencies: list[float] = []
    redactions = 0
    for row in decisions:
        counts[row.outcome] = counts.get(row.outcome, 0) + 1
        latencies.append(float(row.latency_ms or 0))
        if row.redactions:
            redactions += 1
        hour = (row.created_at or "")[:13]
        bucket = hourly.setdefault(hour, {"hour": hour, "ALLOW": 0, "ESCALATE": 0, "BLOCK": 0})
        bucket[row.outcome] = bucket.get(row.outcome, 0) + 1
    from decidion_api.clock import parse_ts, utcnow
    from datetime import timezone

    now = parse_ts(utcnow()).astimezone(timezone.utc)
    open_rows = [row for row in escalations if row.status == "open"]
    breached = 0
    for row in open_rows:
        if parse_ts(row.sla_due_at).astimezone(timezone.utc) < now:
            breached += 1
    drift = []
    for agent in agents:
        recent = recent_block_rate(db, agent.id)
        delta = abs(recent - float(agent.baseline_block_rate or 0))
        state = "ok"
        if delta >= 0.25:
            state = "watch"
        if delta >= 0.75:
            state = "breach"
        drift.append(
            {
                "agent_id": agent.id,
                "name": agent.name,
                "status": agent.status,
                "baseline_block_rate": round(float(agent.baseline_block_rate or 0), 3),
                "recent_block_rate": round(recent, 3),
                "drift": round(delta, 3),
                "state": state,
            }
        )
    return {
        "agents": {
            "total": len(agents),
            "active": sum(1 for agent in agents if agent.status == "active"),
            "halted": sum(1 for agent in agents if agent.status == "halted"),
        },
        "decisions": {
            "total": len(decisions),
            "allow": counts.get("ALLOW", 0),
            "escalate": counts.get("ESCALATE", 0),
            "block": counts.get("BLOCK", 0),
        },
        "latency_ms": {
            "p50": round(_percentile(latencies, 0.50), 3),
            "p95": round(_percentile(latencies, 0.95), 3),
            "samples": len(latencies),
        },
        "escalations": {
            "open": len(open_rows),
            "breached": breached,
            "resolved": sum(1 for row in escalations if row.status != "open"),
        },
        "kill_switches": {
            "armed": sum(1 for switch in switches if switch.enabled),
            "trips": sum(switch.trip_count or 0 for switch in switches),
        },
        "redactions": redactions,
        "drift": drift,
        "hourly": [hourly[key] for key in sorted(hourly)],
        "evaluators": evaluator_catalog(),
        "note": "Counts come from this database. They are not the marketing-site totals.",
    }


def finops(db: Session) -> dict:
    decisions = db.scalars(select(Decision).where(Decision.sandbox.is_(False))).all()
    tokens_in = sum(int(row.tokens_in or 0) for row in decisions)
    tokens_forwarded = sum(int(row.tokens_forwarded or 0) for row in decisions)
    ratio = 0.0 if tokens_in == 0 else max(0.0, 1 - (tokens_forwarded / tokens_in))
    price = 3.0
    return {
        "tokens_in": tokens_in,
        "tokens_forwarded": tokens_forwarded,
        "savings_ratio": round(ratio, 4),
        "illustrative_price_per_million_usd": price,
        "illustrative_ungoverned_usd": round(tokens_in / 1_000_000 * price, 4),
        "illustrative_forwarded_usd": round(tokens_forwarded / 1_000_000 * price, 4),
        "note": (
            "Token counts are length/4 estimates of the original payload versus the "
            "governance summary. The price is illustrative. This is not an invoice, "
            "and it is not the marketing claim of 97% token efficiency."
        ),
    }
