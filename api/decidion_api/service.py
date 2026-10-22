"""Persistence around the pure policy engine."""

from __future__ import annotations

import re
import secrets
import time
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from decidion_api.clock import parse_ts, utcnow
from decidion_api.engine.audit import append_audit, audit_lock
from decidion_api.engine.evaluators import BUILTIN_POLICY_IDS
from decidion_api.engine.harness import run_harness
from decidion_api.engine.policy import evaluate
from decidion_api.engine.types import (
    KILL_CONDITIONS,
    ROLE_SLA_HOURS,
    ActionContext,
    AgentState,
    PolicyState,
    SwitchState,
)
from decidion_api.errors import AgentNotFound, PolicyError
from decidion_api.metrics import recent_block_rate
from decidion_api.models import Agent, Decision, Escalation, Evaluation, KillSwitch, Policy

_TOOL = re.compile(r"[A-Za-z0-9_.:-]{1,80}")
_POLICY_ID = re.compile(r"P-[A-Z0-9-]{1,32}")
_WHEN_KEYS = {
    "tool_in",
    "tool_not_in",
    "amount_gte",
    "amount_lt",
    "args_present",
    "arg_equals",
    "arg_in",
    "prompt_regex",
    "payload_regex",
}
_ENVS = {"development", "pre-production", "production"}
_ROLES = set(ROLE_SLA_HOURS)


def _new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(4)}"


def _locked(db: Session, fn):
    with audit_lock:
        try:
            result = fn()
            db.commit()
            return result
        except Exception:
            db.rollback()
            raise


def _load_controls(db: Session) -> tuple[list[PolicyState], list[SwitchState]]:
    policies = [
        PolicyState(
            id=row.id,
            name=row.name,
            enabled=bool(row.enabled),
            rules=list(row.rules or []),
            description=row.description or "",
            custom=bool(row.custom),
        )
        for row in db.scalars(select(Policy)).all()
    ]
    switches = [
        SwitchState(key=row.key, enabled=bool(row.enabled), threshold=row.threshold)
        for row in db.scalars(select(KillSwitch)).all()
    ]
    return policies, switches


def _agent_state(db: Session, agent: Agent) -> AgentState:
    return AgentState(
        id=agent.id,
        status=agent.status,
        tools_allowed=list(agent.tools_allowed or []),
        industry=agent.industry or "general",
        recent_block_rate=recent_block_rate(db, agent.id),
        baseline_block_rate=float(agent.baseline_block_rate or 0),
    )


def _finding_dict(finding) -> dict:
    evidence = {}
    for key, value in (finding.evidence or {}).items():
        evidence[key] = value[:180] if isinstance(value, str) else value
    return {
        "evaluator": finding.evaluator,
        "policy_id": finding.policy_id,
        "rule_id": finding.rule_id,
        "outcome": finding.outcome,
        "reason": finding.reason,
        "route": finding.route,
        "kill_condition": finding.kill_condition,
        "evidence": evidence,
    }


def agent_dict(agent: Agent) -> dict:
    return {
        "id": agent.id,
        "name": agent.name,
        "framework": agent.framework,
        "owner": agent.owner,
        "environment": agent.environment,
        "status": agent.status,
        "industry": agent.industry,
        "description": agent.description,
        "tools_allowed": agent.tools_allowed or [],
        "baseline_block_rate": agent.baseline_block_rate,
        "created_at": agent.created_at,
    }


def decision_dict(row: Decision, agent_name: str = "", framework: str = "") -> dict:
    return {
        "id": row.id,
        "agent_id": row.agent_id,
        "agent_name": agent_name,
        "framework": framework,
        "tool": row.tool,
        "arguments": row.arguments,
        "prompt": row.prompt,
        "outcome": row.outcome,
        "risk_score": row.risk_score,
        "latency_ms": row.latency_ms,
        "engine_ms": row.engine_ms,
        "fast_path": row.fast_path,
        "sandbox": row.sandbox,
        "reasons": row.reasons or [],
        "findings": row.findings or [],
        "redactions": row.redactions or [],
        "redacted_arguments": row.arguments,
        "redacted_prompt": row.prompt,
        "policy_ids": row.policy_ids or [],
        "route": row.route,
        "kill_condition": row.kill_condition,
        "killed": row.killed,
        "escalation_id": row.escalation_id,
        "tokens_in": row.tokens_in,
        "tokens_forwarded": row.tokens_forwarded,
        "audit_hash": row.audit_hash,
        "created_at": row.created_at,
    }


def sla_state(row: Escalation) -> str:
    if row.status != "open":
        return "closed"
    now = parse_ts(utcnow())
    due = parse_ts(row.sla_due_at)
    if now > due:
        return "breached"
    if now > due - timedelta(minutes=30):
        return "due_soon"
    return "on_track"


def escalation_dict(row: Escalation, agent_name: str = "") -> dict:
    return {
        "id": row.id,
        "decision_id": row.decision_id,
        "agent_id": row.agent_id,
        "agent_name": agent_name,
        "role": row.role,
        "role_label": {
            "finance_manager": "Finance Manager",
            "cfo": "CFO",
            "compliance_officer": "Compliance Officer",
        }.get(row.role, row.role),
        "status": row.status,
        "sla_due_at": row.sla_due_at,
        "sla_state": sla_state(row),
        "created_at": row.created_at,
        "resolved_at": row.resolved_at,
        "resolver": row.resolver,
        "note": row.note,
    }


def register_agent(
    db: Session,
    *,
    name: str,
    framework: str,
    tools_allowed: list[str],
    owner: str = "unassigned",
    environment: str = "development",
    industry: str = "general",
    description: str = "",
    agent_id: str | None = None,
    baseline_block_rate: float = 0.05,
) -> dict:
    if not name.strip():
        raise PolicyError("name is required")
    if environment not in _ENVS:
        raise PolicyError("environment must be development, pre-production, or production")
    if not isinstance(tools_allowed, list) or not tools_allowed:
        raise PolicyError("tools_allowed must be a non-empty list")
    if any(not isinstance(tool, str) or not _TOOL.fullmatch(tool) for tool in tools_allowed):
        raise PolicyError("each tool must be 1-80 characters of letters, numbers, _ . : -")
    now = utcnow()
    new_id = agent_id or _new_id("agt")

    def write():
        if db.get(Agent, new_id) is not None:
            raise PolicyError(f"Agent id already exists: {new_id}")
        agent = Agent(
            id=new_id,
            name=name.strip()[:120],
            framework=(framework or "custom").strip()[:40],
            owner=(owner or "unassigned")[:80],
            environment=environment,
            status="active",
            industry=(industry or "general")[:40],
            description=(description or "")[:2000],
            tools_allowed=list(tools_allowed),
            baseline_block_rate=baseline_block_rate,
            created_at=now,
        )
        db.add(agent)
        db.flush()
        append_audit(
            db,
            "agent.registered",
            {"agent_id": agent.id, "name": agent.name, "framework": agent.framework, "tools_allowed": agent.tools_allowed},
            now,
        )
        return agent_dict(agent)

    return _locked(db, write)


def govern(
    db: Session,
    *,
    agent_id: str,
    tool: str,
    arguments: dict | None = None,
    prompt: str | None = None,
    sandbox: bool = False,
    at: str | None = None,
) -> dict:
    if db.get(Agent, agent_id) is None:
        raise AgentNotFound(agent_id)
    if arguments is None:
        arguments = {}
    if not isinstance(arguments, dict):
        raise PolicyError("arguments must be an object")
    if not _TOOL.fullmatch(tool or ""):
        raise PolicyError("tool must be 1-80 characters of letters, numbers, _ . : -")
    if prompt is not None and len(prompt) > 20000:
        raise PolicyError("prompt is too long")
    now = at or utcnow()

    def write():
        agent = db.get(Agent, agent_id)
        if agent is None:
            raise AgentNotFound(agent_id)
        policies, switches = _load_controls(db)
        started = time.perf_counter()
        result = evaluate(
            ActionContext(agent=_agent_state(db, agent), tool=tool, arguments=arguments, prompt=prompt),
            policies,
            switches,
        )
        killed = False
        if not sandbox and result.kill_condition:
            agent.status = "halted"
            switch = db.get(KillSwitch, result.kill_condition)
            if switch is not None:
                switch.trip_count = int(switch.trip_count or 0) + 1
                switch.last_tripped_at = now
            killed = True
        decision_id = _new_id("dec")
        escalation_id = None
        if not sandbox and result.outcome == "ESCALATE":
            route = result.route or "compliance_officer"
            escalation_id = _new_id("esc")
            due = (parse_ts(now) + timedelta(hours=ROLE_SLA_HOURS.get(route, 8))).replace(microsecond=0).isoformat()
            db.add(
                Escalation(
                    id=escalation_id,
                    decision_id=decision_id,
                    agent_id=agent.id,
                    role=route,
                    status="open",
                    sla_due_at=due,
                    created_at=now,
                )
            )
        policy_ids: list[str] = []
        findings = []
        for finding in result.findings:
            findings.append(_finding_dict(finding))
            if finding.policy_id and finding.policy_id not in policy_ids:
                policy_ids.append(finding.policy_id)
        latency_ms = round((time.perf_counter() - started) * 1000, 3)
        audit_payload = {
            "decision_id": decision_id,
            "agent_id": agent.id,
            "tool": tool,
            "outcome": result.outcome,
            "risk_score": result.risk_score,
            "policy_ids": policy_ids,
            "route": result.route,
            "kill_condition": result.kill_condition if killed else None,
            "killed": killed,
            "sandbox": sandbox,
            "fast_path": result.fast_path,
            "redactions": result.redaction_labels,
            "reasons": result.reasons,
            "engine_ms": int(round(result.engine_ms)),
        }
        event = append_audit(db, "decision.recorded", audit_payload, now)
        row = Decision(
            id=decision_id,
            agent_id=agent.id,
            tool=tool,
            arguments=result.redacted_arguments,
            prompt=result.redacted_prompt,
            outcome=result.outcome,
            risk_score=result.risk_score,
            latency_ms=latency_ms,
            engine_ms=result.engine_ms,
            fast_path=result.fast_path,
            sandbox=sandbox,
            reasons=result.reasons,
            findings=findings,
            redactions=result.redaction_labels,
            policy_ids=policy_ids,
            route=result.route if result.outcome == "ESCALATE" else None,
            kill_condition=result.kill_condition if killed else None,
            killed=killed,
            escalation_id=escalation_id,
            tokens_in=result.tokens_in,
            tokens_forwarded=result.tokens_forwarded,
            audit_hash=event.hash,
            created_at=now,
        )
        db.add(row)
        db.flush()
        payload = decision_dict(row, agent.name, agent.framework)
        payload["audit_seq"] = event.seq
        return payload

    return _locked(db, write)


def set_agent_status(db: Session, agent_id: str, status: str) -> dict:
    if status not in ("active", "halted"):
        raise PolicyError("status must be active or halted")
    if db.get(Agent, agent_id) is None:
        raise AgentNotFound(agent_id)
    now = utcnow()

    def write():
        agent = db.get(Agent, agent_id)
        if agent is None:
            raise AgentNotFound(agent_id)
        agent.status = status
        append_audit(db, "agent.halted" if status == "halted" else "agent.resumed", {"agent_id": agent.id}, now)
        return agent_dict(agent)

    return _locked(db, write)


def validate_rules(rules: list) -> None:
    if not isinstance(rules, list) or not rules:
        raise PolicyError("A policy needs at least one rule")
    for rule in rules:
        if not isinstance(rule, dict):
            raise PolicyError("Each rule must be an object")
        if not str(rule.get("id") or "").strip() or not str(rule.get("reason") or "").strip():
            raise PolicyError("Each rule needs an id and a reason")
        if rule.get("outcome") not in ("ALLOW", "ESCALATE", "BLOCK"):
            raise PolicyError("Outcome must be ALLOW, ESCALATE, or BLOCK")
        when = rule.get("when")
        if not isinstance(when, dict) or not when:
            raise PolicyError("Each rule needs a when object")
        unknown = set(when) - _WHEN_KEYS
        if unknown:
            raise PolicyError("Unknown when keys: " + ", ".join(sorted(unknown)))
        if rule.get("route") not in (None, *_ROLES):
            raise PolicyError("Unknown escalation route")
        if rule.get("kill_condition") not in (None, *KILL_CONDITIONS):
            raise PolicyError("Unknown kill condition")
        for key in ("prompt_regex", "payload_regex"):
            if key in when:
                try:
                    re.compile(when[key])
                except re.error as exc:
                    raise PolicyError(f"Invalid {key}: {exc}") from exc


def create_policy(db: Session, *, policy_id: str, name: str, description: str, rules: list) -> dict:
    if not _POLICY_ID.fullmatch(policy_id or ""):
        raise PolicyError("Policy id must look like P-CUSTOM")
    if policy_id in BUILTIN_POLICY_IDS:
        raise PolicyError("That id is reserved for a built-in policy")
    validate_rules(rules)
    now = utcnow()

    def write():
        if db.get(Policy, policy_id) is not None:
            raise PolicyError("Policy id already exists")
        row = Policy(
            id=policy_id,
            name=name.strip()[:120] or policy_id,
            description=(description or "")[:2000],
            rules=rules,
            enabled=True,
            custom=True,
            version=1,
            created_at=now,
        )
        db.add(row)
        db.flush()
        append_audit(db, "policy.created", {"policy_id": policy_id, "name": row.name}, now)
        return policy_dict(row)

    return _locked(db, write)


def set_policy_enabled(db: Session, policy_id: str, enabled: bool) -> dict:
    if db.get(Policy, policy_id) is None:
        raise PolicyError("Policy not found")
    now = utcnow()

    def write():
        row = db.get(Policy, policy_id)
        if row is None:
            raise PolicyError("Policy not found")
        row.enabled = bool(enabled)
        row.version = int(row.version or 1) + 1
        append_audit(db, "policy.updated", {"policy_id": policy_id, "enabled": row.enabled}, now)
        return policy_dict(row)

    return _locked(db, write)


def policy_dict(row: Policy) -> dict:
    return {
        "id": row.id,
        "name": row.name,
        "description": row.description,
        "rules": row.rules or [],
        "enabled": row.enabled,
        "custom": row.custom,
        "version": row.version,
        "created_at": row.created_at,
    }


def set_switch(db: Session, key: str, *, enabled: bool | None = None, threshold: float | None = None) -> dict:
    if db.get(KillSwitch, key) is None:
        raise PolicyError("Unknown kill switch")
    now = utcnow()

    def write():
        row = db.get(KillSwitch, key)
        if row is None:
            raise PolicyError("Unknown kill switch")
        if enabled is not None:
            row.enabled = bool(enabled)
        if threshold is not None:
            row.threshold = float(threshold)
        append_audit(
            db,
            "kill_switch.updated",
            {"key": row.key, "enabled": row.enabled, "threshold": row.threshold, "trip_count": row.trip_count},
            now,
        )
        return switch_dict(row)

    return _locked(db, write)


def switch_dict(row: KillSwitch) -> dict:
    return {
        "key": row.key,
        "name": row.name,
        "description": row.description,
        "enabled": row.enabled,
        "threshold": row.threshold,
        "trip_count": row.trip_count,
        "last_tripped_at": row.last_tripped_at,
    }


def resolve_escalation(db: Session, escalation_id: str, *, action: str, note: str, resolver: str) -> dict:
    if action not in ("approve", "reject"):
        raise PolicyError("action must be approve or reject")
    if db.get(Escalation, escalation_id) is None:
        raise PolicyError("Escalation not found")
    now = utcnow()

    def write():
        row = db.get(Escalation, escalation_id)
        if row is None:
            raise PolicyError("Escalation not found")
        if row.status != "open":
            raise PolicyError("Escalation is not open")
        row.status = "approved" if action == "approve" else "rejected"
        row.note = (note or "")[:2000]
        row.resolver = (resolver or row.role)[:80]
        row.resolved_at = now
        append_audit(
            db,
            "escalation.resolved",
            {
                "escalation_id": row.id,
                "decision_id": row.decision_id,
                "agent_id": row.agent_id,
                "role": row.role,
                "status": row.status,
            },
            now,
        )
        agent = db.get(Agent, row.agent_id)
        return escalation_dict(row, agent.name if agent else "")

    return _locked(db, write)


def run_evaluation(db: Session, agent_id: str) -> dict:
    agent = db.get(Agent, agent_id)
    if agent is None:
        raise AgentNotFound(agent_id)
    policies, switches = _load_controls(db)
    state = _agent_state(db, agent)
    started = time.perf_counter()
    scenarios = run_harness(state, policies, switches)
    duration_ms = round((time.perf_counter() - started) * 1000, 3)
    passed = sum(1 for item in scenarios if item["passed"])
    failed = len(scenarios) - passed
    status = "passed" if failed == 0 else "failed"
    now = utcnow()
    evaluation_id = _new_id("ev")

    def write():
        row = Evaluation(
            id=evaluation_id,
            agent_id=agent_id,
            status=status,
            passed=passed,
            failed=failed,
            duration_ms=duration_ms,
            scenarios=scenarios,
            created_at=now,
        )
        db.add(row)
        db.flush()
        append_audit(
            db,
            "evaluation.completed",
            {"evaluation_id": evaluation_id, "agent_id": agent_id, "status": status, "passed": passed, "failed": failed},
            now,
        )
        return {
            "id": row.id,
            "agent_id": row.agent_id,
            "status": row.status,
            "passed": row.passed,
            "failed": row.failed,
            "duration_ms": row.duration_ms,
            "scenarios": row.scenarios,
            "created_at": row.created_at,
            "note": "Scenarios run in a sandbox and do not halt the agent or open escalations.",
        }

    return _locked(db, write)


def _names(db: Session) -> dict[str, Agent]:
    return {agent.id: agent for agent in db.scalars(select(Agent)).all()}


def list_agents(db: Session) -> list[dict]:
    rows = db.scalars(select(Agent).order_by(Agent.created_at.asc())).all()
    return [agent_dict(row) for row in rows]


def list_decisions(db: Session, agent_id: str | None = None, limit: int = 50) -> list[dict]:
    stmt = select(Decision).order_by(Decision.created_at.desc()).limit(min(max(limit, 1), 200))
    if agent_id:
        stmt = stmt.where(Decision.agent_id == agent_id)
    names = _names(db)
    items = []
    for row in db.scalars(stmt).all():
        agent = names.get(row.agent_id)
        items.append(decision_dict(row, agent.name if agent else "", agent.framework if agent else ""))
    return items


def list_escalations(db: Session, status: str | None = None) -> list[dict]:
    stmt = select(Escalation).order_by(Escalation.created_at.desc())
    if status:
        stmt = stmt.where(Escalation.status == status)
    names = _names(db)
    return [
        escalation_dict(row, names[row.agent_id].name if row.agent_id in names else "")
        for row in db.scalars(stmt).all()
    ]


def list_policies(db: Session) -> list[dict]:
    return [policy_dict(row) for row in db.scalars(select(Policy).order_by(Policy.id.asc())).all()]


def list_switches(db: Session) -> list[dict]:
    return [switch_dict(row) for row in db.scalars(select(KillSwitch).order_by(KillSwitch.key.asc())).all()]


def list_evaluations(db: Session, limit: int = 20) -> list[dict]:
    rows = db.scalars(select(Evaluation).order_by(Evaluation.created_at.desc()).limit(min(limit, 50))).all()
    return [
        {
            "id": row.id,
            "agent_id": row.agent_id,
            "status": row.status,
            "passed": row.passed,
            "failed": row.failed,
            "duration_ms": row.duration_ms,
            "scenarios": row.scenarios,
            "created_at": row.created_at,
        }
        for row in rows
    ]
