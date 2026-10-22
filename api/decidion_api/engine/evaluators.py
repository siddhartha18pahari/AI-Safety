"""Pluggable governance evaluators.

Finance, AML, Fraud, and custom policies are policy-as-code modules executed by
the same rule runner. System, Generic (prompt injection), Data Governance, and
Drift add detection that is not only a static rule.
"""

from __future__ import annotations

import re

from decidion_api.engine.redact import EXTERNAL_TOOLS, PHI_LABELS, PII_LABELS, redact_payload
from decidion_api.engine.types import ActionContext, Finding, PolicyState, SwitchState


INJECTION_PATTERNS = (
    re.compile(r"(?i)ignore (all |any )?(previous|prior|above) instructions"),
    re.compile(r"(?i)\b(jailbreak|do anything now)\b"),
    re.compile(r"(?i)reveal (the )?(system|hidden) prompt"),
    re.compile(r"(?i)you are now (?:a |an )?(?:unfiltered|dan|developer mode)"),
)

BUILTIN_POLICY_IDS = {"P-GEN", "P-FIN", "P-AML", "P-FRAUD", "P-DG", "P-SYS"}


def _policy(policies: list[PolicyState], policy_id: str) -> PolicyState | None:
    for item in policies:
        if item.id == policy_id:
            return item
    return None


class PolicyModule:
    """Runs one policy document. Subclasses may append extra findings."""

    name = "Policy"
    policy_id = ""

    def extra(self, ctx: ActionContext, policy: PolicyState | None, switches: list[SwitchState]) -> list[Finding]:
        return []

    def run(self, ctx: ActionContext, policies: list[PolicyState], switches: list[SwitchState]) -> list[Finding]:
        from decidion_api.engine.policy import findings_from_rules

        policy = _policy(policies, self.policy_id) if self.policy_id else None
        found = findings_from_rules(self.name, policy, ctx) if policy else []
        found.extend(self.extra(ctx, policy, switches))
        return found


class GenericEvaluator(PolicyModule):
    name = "Generic"
    policy_id = "P-GEN"

    def extra(self, ctx: ActionContext, policy: PolicyState | None, switches: list[SwitchState]) -> list[Finding]:
        if policy is not None and not policy.enabled:
            return []
        text = f"{ctx.prompt or ''}\n{ctx.arguments}"
        for pattern in INJECTION_PATTERNS:
            match = pattern.search(text)
            if not match:
                continue
            return [
                Finding(
                    evaluator=self.name,
                    policy_id="P-GEN",
                    rule_id="prompt-injection",
                    outcome="BLOCK",
                    reason="Prompt injection pattern detected",
                    kill_condition="prompt_injection",
                    evidence={"match": match.group(0)[:120]},
                )
            ]
        return []


class FinanceEvaluator(PolicyModule):
    name = "Finance"
    policy_id = "P-FIN"


class AMLEvaluator(PolicyModule):
    name = "AML"
    policy_id = "P-AML"


class FraudEvaluator(PolicyModule):
    name = "Fraud"
    policy_id = "P-FRAUD"


class SystemEvaluator:
    name = "System"
    policy_id = "P-SYS"

    def run(self, ctx: ActionContext, policies: list[PolicyState], switches: list[SwitchState]) -> list[Finding]:
        allowed = set(ctx.agent.tools_allowed or [])
        if ctx.tool not in allowed:
            return [
                Finding(
                    evaluator=self.name,
                    policy_id="P-SYS",
                    rule_id="allowlist",
                    outcome="BLOCK",
                    reason=f"Tool '{ctx.tool}' is outside the agent allowlist",
                    kill_condition="unauthorized_tool",
                    evidence={"tool": ctx.tool},
                )
            ]
        return []


class DataGovernanceEvaluator(PolicyModule):
    name = "Data Governance"
    policy_id = "P-DG"

    def extra(self, ctx: ActionContext, policy: PolicyState | None, switches: list[SwitchState]) -> list[Finding]:
        if policy is not None and not policy.enabled:
            return []
        redaction = redact_payload(ctx.arguments, ctx.prompt)
        if not redaction.labels:
            return []
        labels = set(redaction.labels)
        external = ctx.tool in EXTERNAL_TOOLS
        phi = bool(labels & PHI_LABELS)
        pii = bool(labels & PII_LABELS)
        if phi and external:
            outcome, kill, reason = "BLOCK", "phi_exposure", "PHI detected on an external tool"
        elif pii and external:
            outcome, kill, reason = "BLOCK", "pii_exfiltration", "PII detected on an external tool"
        else:
            outcome, kill, reason = "ALLOW", None, "Sensitive pattern redacted before retention"
        return [
            Finding(
                evaluator=self.name,
                policy_id="P-DG",
                rule_id="pattern-redaction",
                outcome=outcome,
                reason=reason,
                kill_condition=kill,
                evidence={"labels": redaction.labels, "external": external},
            )
        ]


class DriftEvaluator:
    name = "Drift"
    policy_id = None

    def run(self, ctx: ActionContext, policies: list[PolicyState], switches: list[SwitchState]) -> list[Finding]:
        switch = next((item for item in switches if item.key == "policy_drift"), None)
        if switch is None or not switch.enabled or switch.threshold is None:
            return []
        drift = abs(ctx.agent.recent_block_rate - ctx.agent.baseline_block_rate)
        if drift < float(switch.threshold):
            return []
        return [
            Finding(
                evaluator=self.name,
                policy_id="P-SYS",
                rule_id="block-rate-drift",
                outcome="BLOCK",
                reason=f"Block-rate drift {drift:.2f} exceeds {float(switch.threshold):.2f}",
                kill_condition="policy_drift",
                evidence={
                    "recent_block_rate": round(ctx.agent.recent_block_rate, 3),
                    "baseline_block_rate": round(ctx.agent.baseline_block_rate, 3),
                },
            )
        ]


class CustomPolicyEvaluator:
    name = "Custom"
    policy_id = None

    def run(self, ctx: ActionContext, policies: list[PolicyState], switches: list[SwitchState]) -> list[Finding]:
        from decidion_api.engine.policy import findings_from_rules

        found: list[Finding] = []
        for policy in policies:
            if policy.id in BUILTIN_POLICY_IDS or not policy.custom:
                continue
            found.extend(findings_from_rules(self.name, policy, ctx))
        return found


EVALUATORS = [
    SystemEvaluator(),
    GenericEvaluator(),
    FinanceEvaluator(),
    AMLEvaluator(),
    FraudEvaluator(),
    DataGovernanceEvaluator(),
    DriftEvaluator(),
    CustomPolicyEvaluator(),
]


def evaluator_catalog() -> list[dict]:
    catalog = []
    for item in EVALUATORS:
        catalog.append({"name": item.name, "policy_id": getattr(item, "policy_id", None)})
    return catalog
