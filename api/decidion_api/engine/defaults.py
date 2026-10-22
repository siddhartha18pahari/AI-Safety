"""Built-in policy-as-code, kill-switch conditions, and role labels.

The sanctions entries are an illustration for the demo, not an OFAC or UN list.
"""

from __future__ import annotations

SANCTIONED_COUNTRIES = ["IR", "KP", "SY", "CU"]

PROTECTED_ATTRIBUTES = [
    "race",
    "religion",
    "gender",
    "sex",
    "ethnicity",
    "national_origin",
    "disability",
]

FINANCIAL_TOOLS = ["approve_loan", "price_policy", "decline_application", "set_rate", "issue_payment", "wire_transfer"]

KILL_SWITCHES = [
    {
        "key": "bias",
        "name": "Bias",
        "description": "Halt the agent when a protected attribute is used in a covered decision.",
        "threshold": None,
    },
    {
        "key": "fraud",
        "name": "Fraud",
        "description": "Halt the agent on gift-card, carding, or high-value refund patterns.",
        "threshold": None,
    },
    {
        "key": "aml",
        "name": "AML",
        "description": "Halt the agent on structuring language or an illustrative sanctions hit.",
        "threshold": None,
    },
    {
        "key": "compliance",
        "name": "Compliance",
        "description": "Halt the agent when a payload asks to bypass the audit log.",
        "threshold": None,
    },
    {
        "key": "pii_exfiltration",
        "name": "PII exfiltration",
        "description": "Halt the agent when PII is about to leave through an external tool.",
        "threshold": None,
    },
    {
        "key": "prompt_injection",
        "name": "Prompt injection",
        "description": "Halt the agent when instruction-override language is detected.",
        "threshold": None,
    },
    {
        "key": "phi_exposure",
        "name": "PHI exposure",
        "description": "Halt the agent when PHI is about to leave through an external tool.",
        "threshold": None,
    },
    {
        "key": "policy_drift",
        "name": "Policy drift",
        "description": "Halt the agent when its recent block rate diverges from the baseline.",
        "threshold": 0.75,
    },
    {
        "key": "unauthorized_tool",
        "name": "Unauthorized tool",
        "description": "Halt the agent when it calls a tool outside its allowlist.",
        "threshold": None,
    },
]

POLICIES = [
    {
        "id": "P-GEN",
        "name": "General safety",
        "custom": False,
        "description": "Destructive tools and attempts to disable the audit trail.",
        "rules": [
            {
                "id": "destructive-tool",
                "when": {"tool_in": ["drop_database", "disable_audit", "exfiltrate", "wire_all_funds"]},
                "outcome": "BLOCK",
                "kill_condition": "unauthorized_tool",
                "reason": "Destructive tool is not permitted",
            },
            {
                "id": "bypass-audit",
                "when": {"payload_regex": "(?i)(bypass the audit|don't log|do not log|off the books)"},
                "outcome": "BLOCK",
                "kill_condition": "compliance",
                "reason": "Payload asks to bypass the audit trail",
            },
        ],
    },
    {
        "id": "P-FIN",
        "name": "Finance",
        "custom": False,
        "description": "Amount thresholds and protected attributes on financial decisions.",
        "rules": [
            {
                "id": "protected-attribute",
                "when": {
                    "tool_in": ["approve_loan", "price_policy", "decline_application", "set_rate"],
                    "args_present": PROTECTED_ATTRIBUTES,
                },
                "outcome": "BLOCK",
                "kill_condition": "bias",
                "reason": "Protected attribute included in a financial decision",
            },
            {
                "id": "cfo-threshold",
                "when": {"tool_in": FINANCIAL_TOOLS, "amount_gte": 100000},
                "outcome": "ESCALATE",
                "route": "cfo",
                "reason": "Amount requires CFO review",
            },
            {
                "id": "manager-threshold",
                "when": {"tool_in": FINANCIAL_TOOLS, "amount_gte": 10000},
                "outcome": "ESCALATE",
                "route": "finance_manager",
                "reason": "Amount requires finance manager review",
            },
        ],
    },
    {
        "id": "P-AML",
        "name": "Anti-money laundering",
        "custom": False,
        "description": "Threshold wires, structuring language, and an illustrative sanctions list.",
        "rules": [
            {
                "id": "structuring-language",
                "when": {"payload_regex": "(?i)(structur(e|ing)|split the (wire|payment)|keep it under 10)"},
                "outcome": "BLOCK",
                "kill_condition": "aml",
                "reason": "Possible structuring language",
            },
            {
                "id": "sanctions-country",
                "when": {
                    "tool_in": ["wire_transfer", "issue_payment", "approve_loan"],
                    "arg_in": {"country": SANCTIONED_COUNTRIES},
                },
                "outcome": "BLOCK",
                "kill_condition": "aml",
                "reason": "Counterparty country is on the illustrative sanctions list",
            },
            {
                "id": "wire-threshold",
                "when": {"tool_in": ["wire_transfer"], "amount_gte": 10000},
                "outcome": "ESCALATE",
                "route": "compliance_officer",
                "reason": "Wire at or above the AML review threshold",
            },
            {
                "id": "kyc-sanctions-hit",
                "when": {
                    "tool_in": ["screen_customer"],
                    "arg_in": {"country": SANCTIONED_COUNTRIES},
                },
                "outcome": "ESCALATE",
                "route": "compliance_officer",
                "reason": "Screening hit on the illustrative sanctions list",
            },
        ],
    },
    {
        "id": "P-FRAUD",
        "name": "Fraud",
        "custom": False,
        "description": "Gift-card and carding patterns, plus large refunds.",
        "rules": [
            {
                "id": "gift-card",
                "when": {"payload_regex": "(?i)(gift cards?|carding|card tester)"},
                "outcome": "BLOCK",
                "kill_condition": "fraud",
                "reason": "Fraud pattern in the tool payload",
            },
            {
                "id": "large-refund",
                "when": {"tool_in": ["issue_refund"], "amount_gte": 10000},
                "outcome": "BLOCK",
                "kill_condition": "fraud",
                "reason": "Refund at or above the hard fraud threshold",
            },
            {
                "id": "refund-review",
                "when": {"tool_in": ["issue_refund"], "amount_gte": 2000},
                "outcome": "ESCALATE",
                "route": "finance_manager",
                "reason": "Refund requires finance review",
            },
        ],
    },
    {
        "id": "P-DG",
        "name": "Data governance",
        "custom": False,
        "description": "External export tools. Pattern-based PII and PHI detection runs alongside these rules.",
        "rules": [
            {
                "id": "export-phi",
                "when": {"tool_in": ["export_phi"]},
                "outcome": "BLOCK",
                "kill_condition": "phi_exposure",
                "reason": "PHI export tool is blocked by data-governance policy",
            }
        ],
    },
    {
        "id": "P-SYS",
        "name": "System",
        "custom": False,
        "description": "Allowlist and halt state are enforced by the System evaluator for every registered agent.",
        "rules": [],
    },
    {
        "id": "P-SUPPORT",
        "name": "Support credits",
        "custom": True,
        "description": "Example custom policy: support credits over $1,000 need a finance manager.",
        "rules": [
            {
                "id": "credit-review",
                "when": {"tool_in": ["issue_credit"], "amount_gte": 1000},
                "outcome": "ESCALATE",
                "route": "finance_manager",
                "reason": "Support credits over $1,000 need finance manager review",
            }
        ],
    },
]
