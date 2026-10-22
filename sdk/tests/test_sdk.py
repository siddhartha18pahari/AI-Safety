import json

import httpx
import pytest

from decidion import Decidion, DecidionBlocked, DecidionEscalated
from decidion.adapters.autogen import govern_reply
from decidion.adapters.crewai import GovernedCrew
from decidion.adapters.langchain import govern_runnable
from decidion.adapters.langgraph import govern_node
from decidion.adapters.webhook import webhook_body


def _decision(outcome: str) -> dict:
    return {
        "id": "dec_test",
        "agent_id": "agt_test",
        "outcome": outcome,
        "risk_score": 18,
        "latency_ms": 1.2,
        "engine_ms": 0.4,
        "fast_path": False,
        "reasons": [outcome],
        "route": "cfo" if outcome == "ESCALATE" else None,
        "escalation_id": "esc_test" if outcome == "ESCALATE" else None,
        "killed": outcome == "BLOCK",
        "kill_condition": "bias" if outcome == "BLOCK" else None,
        "arguments": {},
        "redactions": [],
        "findings": [],
        "audit_hash": "abc",
    }


class Inner:
    def __init__(self):
        self.called = False

    def invoke(self, inputs, **kwargs):
        self.called = True
        return {"ok": True, "inputs": inputs}

    def kickoff(self, inputs=None):
        self.called = True
        return {"ok": True}


def test_client_posts_decide_and_webhook():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["path"] = request.url.path
        seen["body"] = json.loads(request.content.decode())
        seen["auth"] = request.headers["authorization"]
        return httpx.Response(200, json=_decision("ALLOW"))

    with Decidion("http://decidion.test", api_key="ddn_demo_local", transport=httpx.MockTransport(handler)) as client:
        decision = client.decide("agt_credit", "approve_loan", {"amount": 10}, prompt="Approve")
        assert decision.outcome == "ALLOW"
        assert seen["path"] == "/v1/decide"
        assert seen["body"]["tool"] == "approve_loan"
        assert seen["auth"] == "Bearer ddn_demo_local"
        client.decide_webhook("agt_credit", "approve_loan", {"amount": 10})
        assert seen["path"] == "/v1/hooks/decide"
        assert webhook_body("agt_credit", "approve_loan", {"amount": 10})["tool"] == "approve_loan"


def test_adapters_stop_before_the_inner_call():
    class Scripted:
        def __init__(self, outcome):
            self.outcome = outcome

        def decide(self, agent_id, tool, arguments=None, prompt=None, sandbox=False):
            from decidion.client import Decision

            return Decision.from_json(_decision(self.outcome))

    inner = Inner()
    with pytest.raises(DecidionBlocked):
        govern_runnable(Scripted("BLOCK"), "agt", inner).invoke({"x": 1})
    assert inner.called is False

    allowed = Inner()
    result = govern_runnable(Scripted("ALLOW"), "agt", allowed).invoke({"x": 1})
    assert allowed.called is True
    assert result["ok"] is True

    crew = Inner()
    with pytest.raises(DecidionEscalated):
        GovernedCrew(Scripted("ESCALATE"), "agt", crew).kickoff({"task": "pay"})
    assert crew.called is False

    def reply(messages=None):
        raise AssertionError("reply should not run")

    wrapped = govern_reply(Scripted("BLOCK"), "agt", reply)
    with pytest.raises(DecidionBlocked):
        wrapped(messages=[{"role": "user", "content": "go"}])

    def node_fn(state):
        return {"ran": True, **state}

    gated = govern_node(Scripted("ALLOW"), "agt", "langgraph.act", node_fn)
    assert gated({"step": 1})["ran"] is True
    with pytest.raises(DecidionBlocked):
        govern_node(Scripted("BLOCK"), "agt", "langgraph.act", node_fn)({"step": 1})
