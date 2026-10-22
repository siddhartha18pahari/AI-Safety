AUTH = {"Authorization": "Bearer test-key"}


def test_health_is_open_and_decide_requires_a_key(client):
    assert client.get("/health").json()["status"] == "ok"
    denied = client.post("/v1/decide", json={"agent_id": "agt_credit", "tool": "lookup_applicant"})
    assert denied.status_code == 401


def test_seeded_flow_webhook_and_report(client):
    agents = client.get("/v1/agents", headers=AUTH)
    assert agents.status_code == 200
    ids = {item["id"] for item in agents.json()}
    assert "agt_credit" in ids
    assert "agt_rogue" in ids

    decision = client.post(
        "/v1/decide",
        headers=AUTH,
        json={
            "agent_id": "agt_credit",
            "tool": "approve_loan",
            "arguments": {"amount": 240000, "customer_id": "C-1", "purpose": "facility"},
            "prompt": "Approve the facility",
        },
    )
    assert decision.status_code == 200, decision.text
    body = decision.json()
    assert body["outcome"] == "ESCALATE"
    assert body["route"] == "cfo"
    assert body["escalation_id"]

    hook = client.post(
        "/v1/hooks/decide",
        headers=AUTH,
        json={"agent_id": "agt_coding", "tool": "read_repo", "arguments": {"repo": "pricing-service"}},
    )
    assert hook.status_code == 200
    assert hook.json()["outcome"] == "ALLOW"

    verified = client.get("/v1/audit/verify", headers=AUTH)
    assert verified.json()["ok"] is True
    report = client.get("/v1/compliance/reports", headers=AUTH, params={"framework": "EU_AI_ACT"})
    assert report.status_code == 200
    payload = report.json()
    assert payload["audit_verified"] is True
    assert {item["id"] for item in payload["controls"]} >= {"ART-9", "ART-12", "ART-14"}

    rogue = next(item for item in agents.json() if item["id"] == "agt_rogue")
    assert rogue["status"] == "halted"
