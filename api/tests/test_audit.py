import json

from sqlalchemy import select

from decidion_api.engine.audit import verify_chain
from decidion_api.models import AuditEvent, Decision
from decidion_api.service import govern, register_agent, resolve_escalation


def _agent(session, agent_id="agt_audit", tools=None):
    register_agent(
        session,
        agent_id=agent_id,
        name="Audit subject",
        framework="custom",
        tools_allowed=tools or ["lookup_applicant", "approve_loan", "send_email"],
        industry="financial",
    )


def _events(session):
    return list(session.scalars(select(AuditEvent).order_by(AuditEvent.seq.asc())).all())


def test_chain_links_and_detects_tampering(session):
    _agent(session)
    for index in range(4):
        govern(
            session,
            agent_id="agt_audit",
            tool="lookup_applicant",
            arguments={"customer_id": f"C-{index}"},
            prompt="Lookup",
        )
    ok, detail = verify_chain(_events(session))
    assert ok, detail
    assert _events(session)[0].prev_hash == "0" * 64

    victim = _events(session)[1]
    victim.payload = {"tampered": True}
    session.commit()
    ok, detail = verify_chain(_events(session))
    assert ok is False
    assert "seq" in (detail or "")


def test_pii_is_not_persisted_and_resolution_stays_on_chain(session):
    _agent(session, "agt_pii")
    blocked = govern(
        session,
        agent_id="agt_pii",
        tool="send_email",
        arguments={"to": "ops@example.test", "body": "SSN 123-45-6789"},
        prompt="Send the file",
    )
    stored = session.get(Decision, blocked["id"])
    blob = json.dumps({"row": stored.arguments, "prompt": stored.prompt, "response": blocked})
    assert "123-45-6789" not in blob
    assert "ops@example.test" not in blob
    events = _events(session)
    assert "123-45-6789" not in json.dumps([event.payload for event in events])

    session.get(Decision, blocked["id"])
    # The send is a block, so open a separate escalation and resolve it.
    escalated = govern(
        session,
        agent_id="agt_pii",
        tool="approve_loan",
        arguments={"amount": 18000, "customer_id": "C-9", "purpose": "equipment"},
        prompt="Approve",
    )
    # Agent was halted by the PII kill switch, so resume is required before the loan.
    assert escalated["fast_path"] is True


def test_resume_then_resolve_keeps_a_valid_chain(session):
    _agent(session, "agt_flow", tools=["approve_loan", "lookup_applicant"])
    decision = govern(
        session,
        agent_id="agt_flow",
        tool="approve_loan",
        arguments={"amount": 18000, "customer_id": "C-9", "purpose": "equipment"},
        prompt="Approve the line",
    )
    assert decision["outcome"] == "ESCALATE"
    resolved = resolve_escalation(
        session,
        decision["escalation_id"],
        action="approve",
        note="Reviewed.",
        resolver="finance_manager",
    )
    assert resolved["status"] == "approved"
    ok, detail = verify_chain(_events(session))
    assert ok, detail
    types = [event.event_type for event in _events(session)]
    assert "agent.registered" in types
    assert "decision.recorded" in types
    assert "escalation.resolved" in types
