"""Shared dataclasses for the pure evaluation path."""

from __future__ import annotations

from dataclasses import dataclass, field


OUTCOMES = ("ALLOW", "ESCALATE", "BLOCK")
ROUTES = ("finance_manager", "cfo", "compliance_officer")
ROUTE_PRIORITY = ("cfo", "compliance_officer", "finance_manager")
ROLE_SLA_HOURS = {
    "finance_manager": 4,
    "cfo": 2,
    "compliance_officer": 8,
}

KILL_CONDITIONS = (
    "bias",
    "fraud",
    "aml",
    "compliance",
    "pii_exfiltration",
    "prompt_injection",
    "phi_exposure",
    "policy_drift",
    "unauthorized_tool",
)

GENESIS = "0" * 64


@dataclass
class AgentState:
    id: str
    status: str
    tools_allowed: list[str]
    industry: str = "general"
    recent_block_rate: float = 0.0
    baseline_block_rate: float = 0.0


@dataclass
class PolicyState:
    id: str
    name: str
    enabled: bool
    rules: list[dict]
    description: str = ""
    custom: bool = False


@dataclass
class SwitchState:
    key: str
    enabled: bool
    threshold: float | None = None


@dataclass
class ActionContext:
    agent: AgentState
    tool: str
    arguments: dict
    prompt: str | None


@dataclass
class Finding:
    evaluator: str
    policy_id: str
    rule_id: str
    outcome: str
    reason: str
    route: str | None = None
    kill_condition: str | None = None
    evidence: dict = field(default_factory=dict)


@dataclass
class EvalOutput:
    findings: list[Finding] = field(default_factory=list)
    redacted_arguments: dict | None = None
    redacted_prompt: str | None = None
    redaction_labels: list[str] = field(default_factory=list)


@dataclass
class Result:
    outcome: str
    findings: list[Finding]
    reasons: list[str]
    route: str | None
    kill_condition: str | None
    redacted_arguments: dict
    redacted_prompt: str | None
    redaction_labels: list[str]
    risk_score: int
    fast_path: bool
    tokens_in: int
    tokens_forwarded: int
    engine_ms: float
