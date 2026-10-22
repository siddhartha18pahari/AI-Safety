"""Declarative rule matcher and outcome aggregation."""

from __future__ import annotations

import json
import re
import time
from copy import deepcopy

from decidion_api.engine.evaluators import EVALUATORS
from decidion_api.engine.redact import redact_payload
from decidion_api.engine.types import (
    ROUTE_PRIORITY,
    ActionContext,
    Finding,
    PolicyState,
    Result,
    SwitchState,
)


_SEVERITY = {"ALLOW": 0, "ESCALATE": 1, "BLOCK": 2}


def extract_amount(arguments: dict) -> float | None:
    for key in ("amount", "value", "principal"):
        raw = arguments.get(key)
        if isinstance(raw, bool) or raw is None:
            continue
        if isinstance(raw, (int, float)):
            return float(raw)
        if isinstance(raw, str):
            cleaned = raw.replace(",", "").replace("$", "").strip()
            try:
                return float(cleaned)
            except ValueError:
                continue
    return None


def rule_matches(rule: dict, ctx: ActionContext) -> bool:
    when = rule.get("when") or {}
    if not when:
        return False
    tool = ctx.tool
    if "tool_in" in when and tool not in when["tool_in"]:
        return False
    if "tool_not_in" in when and tool in when["tool_not_in"]:
        return False
    amount = extract_amount(ctx.arguments)
    if "amount_gte" in when:
        if amount is None or amount < float(when["amount_gte"]):
            return False
    if "amount_lt" in when:
        if amount is None or amount >= float(when["amount_lt"]):
            return False
    required = when.get("args_present") or []
    if required:
        present = False
        for key in required:
            value = ctx.arguments.get(key)
            if value is not None and value != "" and value != []:
                present = True
                break
        if not present:
            return False
    for key, expected in (when.get("arg_equals") or {}).items():
        if ctx.arguments.get(key) != expected:
            return False
    for key, options in (when.get("arg_in") or {}).items():
        actual = str(ctx.arguments.get(key, "")).upper()
        allowed = {str(option).upper() for option in options}
        if actual not in allowed:
            return False
    blob = json.dumps(ctx.arguments, sort_keys=True, default=str) + "\n" + (ctx.prompt or "")
    if "prompt_regex" in when and not re.search(when["prompt_regex"], ctx.prompt or ""):
        return False
    if "payload_regex" in when and not re.search(when["payload_regex"], blob):
        return False
    return True


def findings_from_rules(evaluator: str, policy: PolicyState, ctx: ActionContext) -> list[Finding]:
    if not policy.enabled:
        return []
    found: list[Finding] = []
    for rule in policy.rules:
        if not rule_matches(rule, ctx):
            continue
        found.append(
            Finding(
                evaluator=evaluator,
                policy_id=policy.id,
                rule_id=str(rule.get("id") or "rule"),
                outcome=rule.get("outcome") or "ALLOW",
                reason=str(rule.get("reason") or "Policy rule matched"),
                route=rule.get("route"),
                kill_condition=rule.get("kill_condition"),
                evidence={"policy": policy.id},
            )
        )
    return found


def _risk(outcome: str, findings: list[Finding]) -> int:
    base = {"ALLOW": 18, "ESCALATE": 64, "BLOCK": 92}[outcome]
    extra = min(7, len([item for item in findings if item.outcome != "ALLOW"]))
    return min(100, base + extra)


def _estimate_tokens(text: str) -> int:
    return max(1, (len(text) + 3) // 4)


def _choose_route(findings: list[Finding]) -> str | None:
    routes = {item.route for item in findings if item.outcome == "ESCALATE" and item.route}
    for role in ROUTE_PRIORITY:
        if role in routes:
            return role
    return None


def _choose_kill(findings: list[Finding], switches: list[SwitchState]) -> str | None:
    armed = {switch.key for switch in switches if switch.enabled}
    for finding in findings:
        if finding.outcome == "BLOCK" and finding.kill_condition in armed:
            return finding.kill_condition
    return None


def evaluate(
    ctx: ActionContext,
    policies: list[PolicyState],
    switches: list[SwitchState],
) -> Result:
    """Pure evaluation. Does not touch the database."""

    started = time.perf_counter()
    original_args = deepcopy(ctx.arguments or {})
    redaction = redact_payload(original_args, ctx.prompt)

    if ctx.agent.status == "halted":
        finding = Finding(
            evaluator="System",
            policy_id="P-SYS",
            rule_id="agent-halted",
            outcome="BLOCK",
            reason="Agent is halted by a kill switch",
            evidence={"status": "halted"},
        )
        engine_ms = (time.perf_counter() - started) * 1000
        reasons = [finding.reason]
        if redaction.labels:
            reasons.append("Payload redacted before retention: " + ", ".join(redaction.labels))
        tokens_in = _estimate_tokens((ctx.prompt or "") + json.dumps(original_args, default=str))
        summary = json.dumps({"tool": ctx.tool, "outcome": "BLOCK", "fast_path": True}, separators=(",", ":"))
        return Result(
            outcome="BLOCK",
            findings=[finding],
            reasons=reasons,
            route=None,
            kill_condition=None,
            redacted_arguments=redaction.arguments if isinstance(redaction.arguments, dict) else {},
            redacted_prompt=redaction.prompt,
            redaction_labels=redaction.labels,
            risk_score=99,
            fast_path=True,
            tokens_in=tokens_in,
            tokens_forwarded=_estimate_tokens(summary),
            engine_ms=round(engine_ms, 3),
        )

    findings: list[Finding] = []
    for evaluator in EVALUATORS:
        findings.extend(evaluator.run(ctx, policies, switches))

    ranked = [item for item in findings if item.outcome in _SEVERITY]
    if any(item.outcome == "BLOCK" for item in ranked):
        outcome = "BLOCK"
    elif any(item.outcome == "ESCALATE" for item in ranked):
        outcome = "ESCALATE"
    else:
        outcome = "ALLOW"

    reasons: list[str] = []
    for item in ranked:
        if item.outcome == outcome and item.reason not in reasons:
            reasons.append(item.reason)
    if not reasons:
        reasons.append("No policy or evaluator raised a hold")
    if redaction.labels:
        reasons.append("Payload redacted before retention: " + ", ".join(redaction.labels))

    route = None if outcome != "ESCALATE" else _choose_route(ranked)
    kill = None if outcome != "BLOCK" else _choose_kill(ranked, switches)
    tokens_in = _estimate_tokens((ctx.prompt or "") + json.dumps(original_args, default=str))
    summary = json.dumps(
        {
            "tool": ctx.tool,
            "outcome": outcome,
            "risk": _risk(outcome, ranked),
            "rules": [item.rule_id for item in ranked if item.outcome == outcome],
        },
        separators=(",", ":"),
    )
    engine_ms = (time.perf_counter() - started) * 1000
    redacted_args = redaction.arguments if isinstance(redaction.arguments, dict) else {"value": redaction.arguments}
    return Result(
        outcome=outcome,
        findings=ranked,
        reasons=reasons,
        route=route,
        kill_condition=kill,
        redacted_arguments=redacted_args,
        redacted_prompt=redaction.prompt,
        redaction_labels=redaction.labels,
        risk_score=_risk(outcome, ranked),
        fast_path=False,
        tokens_in=tokens_in,
        tokens_forwarded=_estimate_tokens(summary),
        engine_ms=round(engine_ms, 3),
    )
