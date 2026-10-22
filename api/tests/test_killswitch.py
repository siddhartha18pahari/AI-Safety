from decidion_api.models import Agent, KillSwitch
from decidion_api.service import govern, register_agent


def test_bias_trip_halts_agent_and_second_call_is_fast(session):
    register_agent(
        session,
        agent_id="agt_ks",
        name="Kill switch subject",
        framework="custom",
        tools_allowed=["approve_loan", "lookup_applicant"],
        industry="financial",
    )
    first = govern(
        session,
        agent_id="agt_ks",
        tool="approve_loan",
        arguments={"amount": 8000, "customer_id": "C-1", "purpose": "auto", "race": "protected-attribute-demo"},
        prompt="Decide the file",
    )
    assert first["outcome"] == "BLOCK"
    assert first["killed"] is True
    assert first["kill_condition"] == "bias"
    assert first["fast_path"] is False
    agent = session.get(Agent, "agt_ks")
    switch = session.get(KillSwitch, "bias")
    assert agent.status == "halted"
    assert switch.trip_count == 1

    second = govern(
        session,
        agent_id="agt_ks",
        tool="lookup_applicant",
        arguments={"customer_id": "C-1"},
        prompt="Try again",
    )
    assert second["outcome"] == "BLOCK"
    assert second["fast_path"] is True
    assert second["killed"] is False
    assert second["engine_ms"] < 30
    assert session.get(KillSwitch, "bias").trip_count == 1


def test_disarmed_bias_switch_does_not_halt(session):
    register_agent(
        session,
        agent_id="agt_open",
        name="Disarmed",
        framework="custom",
        tools_allowed=["approve_loan"],
        industry="financial",
    )
    switch = session.get(KillSwitch, "bias")
    switch.enabled = False
    session.commit()
    result = govern(
        session,
        agent_id="agt_open",
        tool="approve_loan",
        arguments={"amount": 9000, "customer_id": "C-2", "purpose": "auto", "gender": "unspecified"},
        prompt="Decide",
    )
    assert result["outcome"] == "BLOCK"
    assert result["killed"] is False
    assert session.get(Agent, "agt_open").status == "active"
    assert session.get(KillSwitch, "bias").trip_count == 0
