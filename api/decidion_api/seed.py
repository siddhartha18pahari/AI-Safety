"""Demo agents and a scripted decision history. Idempotent when agents already exist."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from decidion_api.clock import parse_ts, utcnow
from decidion_api.engine.defaults import KILL_SWITCHES, POLICIES
from decidion_api.models import Agent, Escalation, KillSwitch, Policy
from decidion_api.service import govern, register_agent, resolve_escalation, run_evaluation

AGENTS = [
    {
        "agent_id": "agt_credit",
        "name": "Credit underwriter",
        "framework": "langchain",
        "owner": "Consumer Lending",
        "environment": "production",
        "industry": "financial",
        "description": "Approves or escalates consumer credit applications.",
        "tools_allowed": ["lookup_applicant", "approve_loan"],
    },
    {
        "agent_id": "agt_claims",
        "name": "Claims payment agent",
        "framework": "langgraph",
        "owner": "Claims Operations",
        "environment": "production",
        "industry": "insurance",
        "description": "Scores claims and prepares settlement payments.",
        "tools_allowed": ["score_claim", "lookup_policy", "issue_payment"],
    },
    {
        "agent_id": "agt_clinical",
        "name": "Clinical documentation",
        "framework": "custom",
        "owner": "Clinical Informatics",
        "environment": "production",
        "industry": "healthcare",
        "description": "Drafts clinical notes. PHI export is blocked by policy.",
        "tools_allowed": ["draft_note", "lookup_chart", "export_phi"],
    },
    {
        "agent_id": "agt_support",
        "name": "Support copilot",
        "framework": "crewai",
        "owner": "Customer Support",
        "environment": "production",
        "industry": "technology",
        "description": "Looks up tickets and requests goodwill credits.",
        "tools_allowed": ["lookup_ticket", "issue_credit", "send_email"],
    },
    {
        "agent_id": "agt_coding",
        "name": "Coding agent",
        "framework": "autogen",
        "owner": "Engineering",
        "environment": "development",
        "industry": "technology",
        "description": "Reads repositories and opens pull requests.",
        "tools_allowed": ["read_repo", "open_pr", "run_tests"],
    },
    {
        "agent_id": "agt_kyc",
        "name": "KYC refresh",
        "framework": "langchain",
        "owner": "Financial Crime",
        "environment": "production",
        "industry": "financial",
        "description": "Screens customers against the illustrative sanctions list.",
        "tools_allowed": ["screen_customer", "file_alert", "lookup_applicant"],
    },
    {
        "agent_id": "agt_rogue",
        "name": "Shadow underwriter",
        "framework": "custom",
        "owner": "Unassigned",
        "environment": "development",
        "industry": "financial",
        "description": "Unapproved underwriter. The seed ends with this agent halted.",
        "tools_allowed": ["lookup_applicant", "approve_loan"],
    },
]

SCRIPTED = [
    ("agt_credit", "lookup_applicant", {"customer_id": "C-1042"}, "Pull the applicant file"),
    ("agt_credit", "approve_loan", {"amount": 4200, "customer_id": "C-1042", "purpose": "auto"}, "Approve the auto application"),
    ("agt_claims", "score_claim", {"claim_id": "CL-441", "amount": 2200}, "Score the claim"),
    ("agt_claims", "lookup_policy", {"policy_id": "P-19"}, "Load the policy"),
    ("agt_clinical", "lookup_chart", {"patient_id": "PT-14"}, "Open the chart"),
    (
        "agt_clinical",
        "draft_note",
        {"patient_id": "PT-14", "note": "Follow up. MRN: AB18392. DOB: 1981-04-02. Contact jane.doe@hospital.test."},
        "Draft the follow-up note",
    ),
    ("agt_clinical", "draft_note", {"patient_id": "PT-22", "note": "Routine visit, no new medication."}, "Draft a routine note"),
    ("agt_support", "lookup_ticket", {"ticket": "T-100"}, "Open the ticket"),
    ("agt_coding", "read_repo", {"repo": "pricing-service"}, "Read the pricing service"),
    ("agt_coding", "open_pr", {"repo": "pricing-service", "branch": "promo-fix"}, "Open a pull request"),
    ("agt_coding", "run_tests", {"repo": "pricing-service"}, "Run the unit tests"),
    ("agt_kyc", "screen_customer", {"customer_id": "C-77", "country": "US"}, "Screen a domestic customer"),
    ("agt_kyc", "file_alert", {"customer_id": "C-77", "typology": "rapid movement"}, "File an internal alert"),
    (
        "agt_credit",
        "approve_loan",
        {"amount": 18000, "customer_id": "C-2281", "purpose": "equipment"},
        "Approve the equipment line",
    ),
    (
        "agt_claims",
        "issue_payment",
        {"amount": 18000, "claim_id": "CL-441", "purpose": "settlement"},
        "Release the settlement",
    ),
    (
        "agt_support",
        "issue_credit",
        {"amount": 1500, "ticket": "T-100", "purpose": "goodwill"},
        "Offer a goodwill credit",
    ),
    ("agt_kyc", "screen_customer", {"customer_id": "C-90", "country": "IR"}, "Screen the counterparty"),
    (
        "agt_credit",
        "approve_loan",
        {"amount": 240000, "customer_id": "C-8830", "purpose": "facility"},
        "Approve the facility request",
    ),
    ("agt_claims", "score_claim", {"claim_id": "CL-442", "amount": 640}, "Score a small claim"),
    ("agt_support", "lookup_ticket", {"ticket": "T-140"}, "Open another ticket"),
    ("agt_rogue", "lookup_applicant", {"customer_id": "C-1"}, "Look up an applicant"),
    ("agt_rogue", "approve_loan", {"amount": 8000, "customer_id": "C-1", "purpose": "auto"}, "Approve a small auto loan"),
    (
        "agt_rogue",
        "approve_loan",
        {
            "amount": 15000,
            "customer_id": "C-1",
            "purpose": "test",
            "race": "protected-attribute-demo",
        },
        "Decide using a protected attribute",
    ),
]

SAFE_ACTIONS = [
    ("agt_credit", "lookup_applicant", {"customer_id": "C-1042"}),
    ("agt_claims", "score_claim", {"claim_id": "CL-500", "amount": 100}),
    ("agt_kyc", "screen_customer", {"customer_id": "C-77", "country": "US"}),
    ("agt_coding", "read_repo", {"repo": "pricing-service"}),
    ("agt_clinical", "lookup_chart", {"patient_id": "PT-14"}),
    ("agt_support", "lookup_ticket", {"ticket": "T-100"}),
]


def install_defaults(db: Session) -> None:
    now = utcnow()
    for item in POLICIES:
        if db.get(Policy, item["id"]) is None:
            db.add(
                Policy(
                    id=item["id"],
                    name=item["name"],
                    description=item["description"],
                    rules=item["rules"],
                    enabled=True,
                    custom=item["custom"],
                    version=1,
                    created_at=now,
                )
            )
    for item in KILL_SWITCHES:
        if db.get(KillSwitch, item["key"]) is None:
            db.add(
                KillSwitch(
                    key=item["key"],
                    name=item["name"],
                    description=item["description"],
                    enabled=True,
                    threshold=item["threshold"],
                    trip_count=0,
                )
            )
    db.commit()


def seed_if_empty(db: Session) -> bool:
    """Install default policies and, when no agents exist, the demo history.

    Returns True only on the first seed so a restart against Postgres does not
    duplicate agents or decisions.
    """
    install_defaults(db)
    count = db.scalar(select(func.count()).select_from(Agent)) or 0
    if count:
        return False
    for spec in AGENTS:
        register_agent(db, **spec)
    start = datetime.now(timezone.utc) - timedelta(hours=6)
    results = []
    for index, (agent_id, tool, arguments, prompt) in enumerate(SCRIPTED):
        at = (start + timedelta(minutes=15 * index)).replace(microsecond=0).isoformat()
        results.append(
            govern(db, agent_id=agent_id, tool=tool, arguments=arguments, prompt=prompt, at=at)
        )
    cfo = next(item for item in results if item.get("route") == "cfo")
    escalation = db.get(Escalation, cfo["escalation_id"])
    if escalation is not None:
        escalation.sla_due_at = (parse_ts(utcnow()) - timedelta(hours=1)).replace(microsecond=0).isoformat()
        db.commit()
    payment = next(item for item in results if item["tool"] == "issue_payment" and item.get("escalation_id"))
    resolve_escalation(
        db,
        payment["escalation_id"],
        action="approve",
        note="Settlement is inside the reviewed authority.",
        resolver="finance_manager",
    )
    run_evaluation(db, "agt_credit")
    return True
