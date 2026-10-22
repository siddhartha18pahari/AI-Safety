"""Map stored evidence to framework labels. This is not a certification."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from decidion_api.clock import utcnow
from decidion_api.engine.audit import verify_chain
from decidion_api.models import AuditEvent, Decision, Escalation, Evaluation

FRAMEWORKS = ("SOX", "AML", "GDPR", "EU_AI_ACT")


def _ids(rows, limit=5) -> list[str]:
    return [row.id for row in rows[:limit]]


def build_report(db: Session, framework: str) -> dict:
    key = framework.strip().upper().replace("-", "_").replace(" ", "_")
    aliases = {
        "EUAIACT": "EU_AI_ACT",
        "EU_AI_ACT": "EU_AI_ACT",
        "EU_AI": "EU_AI_ACT",
    }
    key = aliases.get(key, key)
    if key not in FRAMEWORKS:
        from decidion_api.errors import PolicyError

        raise PolicyError(f"Unknown framework. Use one of: {', '.join(FRAMEWORKS)}")

    decisions = db.scalars(select(Decision).where(Decision.sandbox.is_(False)).order_by(Decision.created_at.desc())).all()
    events = db.scalars(select(AuditEvent).order_by(AuditEvent.seq.asc())).all()
    escalations = db.scalars(select(Escalation)).all()
    evaluations = db.scalars(select(Evaluation)).all()
    ok, detail = verify_chain(list(events))

    def has_policy(row: Decision, policy_id: str) -> bool:
        return policy_id in (row.policy_ids or [])

    aml_rows = [row for row in decisions if has_policy(row, "P-AML")]
    dg_rows = [row for row in decisions if row.redactions or has_policy(row, "P-DG")]
    resolved = [row for row in escalations if row.status in ("approved", "rejected")]

    catalogs = {
        "SOX": [
            {
                "id": "SOX-ACCOUNTABILITY",
                "title": "Decision accountability",
                "citation": "SOX-style change and decision evidence",
                "count": len(decisions),
                "sample_ids": _ids(decisions),
            },
            {
                "id": "SOX-HUMAN-REVIEW",
                "title": "Human review of escalated decisions",
                "citation": "Escalation resolutions",
                "count": len(resolved),
                "sample_ids": _ids(resolved),
            },
            {
                "id": "SOX-LOG-INTEGRITY",
                "title": "Hash-chained audit log",
                "citation": "Application-level hash chain",
                "count": len(events),
                "sample_ids": [str(event.seq) for event in events[:5]],
            },
        ],
        "AML": [
            {
                "id": "AML-P-AML",
                "title": "P-AML decisions",
                "citation": "AML policy matches, including threshold and sanctions illustration",
                "count": len(aml_rows),
                "sample_ids": _ids(aml_rows),
            },
            {
                "id": "AML-ESCALATIONS",
                "title": "Compliance officer queue",
                "citation": "Escalations routed to compliance_officer",
                "count": sum(1 for row in escalations if row.role == "compliance_officer"),
                "sample_ids": _ids([row for row in escalations if row.role == "compliance_officer"]),
            },
        ],
        "GDPR": [
            {
                "id": "GDPR-REDACTION",
                "title": "PII and PHI redaction events",
                "citation": "Data minimization before retention",
                "count": len(dg_rows),
                "sample_ids": _ids(dg_rows),
            },
            {
                "id": "GDPR-LOG",
                "title": "Processing log",
                "citation": "Audit events for govern decisions",
                "count": len(events),
                "sample_ids": [str(event.seq) for event in events[:5]],
            },
        ],
        "EU_AI_ACT": [
            {
                "id": "ART-9",
                "title": "Risk management",
                "citation": "EU AI Act Article 9",
                "count": len(decisions),
                "sample_ids": _ids(decisions),
            },
            {
                "id": "ART-10",
                "title": "Data governance",
                "citation": "EU AI Act Article 10",
                "count": len(dg_rows),
                "sample_ids": _ids(dg_rows),
            },
            {
                "id": "ART-12",
                "title": "Logging",
                "citation": "EU AI Act Article 12",
                "count": len(events),
                "sample_ids": [str(event.seq) for event in events[:5]],
            },
            {
                "id": "ART-14",
                "title": "Human oversight",
                "citation": "EU AI Act Article 14",
                "count": len(escalations),
                "sample_ids": _ids(escalations),
            },
            {
                "id": "ART-15",
                "title": "Accuracy and robustness",
                "citation": "EU AI Act Article 15",
                "count": len(evaluations),
                "sample_ids": _ids(evaluations),
            },
        ],
    }
    return {
        "framework": key,
        "generated_at": utcnow(),
        "audit_verified": ok,
        "audit_detail": detail,
        "audit_events": len(events),
        "controls": catalogs[key],
        "disclaimer": (
            "This export counts evidence stored by the Decidion MVP. It is not legal advice, "
            "not an attestation, and not a completed control mapping for SOX, AML, GDPR, or the EU AI Act."
        ),
    }
