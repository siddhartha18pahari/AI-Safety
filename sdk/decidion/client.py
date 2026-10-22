from __future__ import annotations

from dataclasses import dataclass

import httpx


class DecidionError(Exception):
    pass


@dataclass
class Decision:
    id: str
    agent_id: str
    outcome: str
    risk_score: int
    latency_ms: float
    engine_ms: float
    fast_path: bool
    reasons: list[str]
    route: str | None
    escalation_id: str | None
    killed: bool
    kill_condition: str | None
    redacted_arguments: dict
    redactions: list[str]
    findings: list[dict]
    audit_hash: str
    raw: dict

    @classmethod
    def from_json(cls, payload: dict) -> "Decision":
        return cls(
            id=payload.get("id", ""),
            agent_id=payload.get("agent_id", ""),
            outcome=payload.get("outcome", ""),
            risk_score=int(payload.get("risk_score") or 0),
            latency_ms=float(payload.get("latency_ms") or 0),
            engine_ms=float(payload.get("engine_ms") or 0),
            fast_path=bool(payload.get("fast_path")),
            reasons=list(payload.get("reasons") or []),
            route=payload.get("route"),
            escalation_id=payload.get("escalation_id"),
            killed=bool(payload.get("killed")),
            kill_condition=payload.get("kill_condition"),
            redacted_arguments=dict(payload.get("redacted_arguments") or payload.get("arguments") or {}),
            redactions=list(payload.get("redactions") or []),
            findings=list(payload.get("findings") or []),
            audit_hash=payload.get("audit_hash") or "",
            raw=payload,
        )


class DecidionBlocked(DecidionError):
    def __init__(self, decision: Decision):
        self.decision = decision
        super().__init__(f"{decision.outcome}: {'; '.join(decision.reasons)}")


class DecidionEscalated(DecidionBlocked):
    pass


class Decidion:
    """HTTP client for the Decidion control plane."""

    def __init__(
        self,
        base_url: str = "http://localhost:8000",
        api_key: str = "ddn_demo_local",
        transport: httpx.BaseTransport | None = None,
        timeout: float = 10.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client = httpx.Client(
            base_url=self.base_url,
            transport=transport,
            timeout=timeout,
            headers={"Authorization": f"Bearer {api_key}"},
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "Decidion":
        return self

    def __exit__(self, *exc) -> None:
        self.close()

    def _post(self, path: str, payload: dict) -> dict:
        response = self._client.post(path, json=payload)
        if response.status_code >= 400:
            raise DecidionError(f"{response.status_code} {response.text}")
        return response.json()

    def register_agent(
        self,
        name: str,
        framework: str,
        tools_allowed: list[str],
        owner: str = "unassigned",
        environment: str = "development",
        industry: str = "general",
        description: str = "",
    ) -> dict:
        return self._post(
            "/v1/agents",
            {
                "name": name,
                "framework": framework,
                "tools_allowed": tools_allowed,
                "owner": owner,
                "environment": environment,
                "industry": industry,
                "description": description,
            },
        )

    def decide(
        self,
        agent_id: str,
        tool: str,
        arguments: dict | None = None,
        prompt: str | None = None,
        sandbox: bool = False,
    ) -> Decision:
        payload = self._post(
            "/v1/decide",
            {
                "agent_id": agent_id,
                "tool": tool,
                "arguments": arguments or {},
                "prompt": prompt,
                "sandbox": sandbox,
            },
        )
        return Decision.from_json(payload)

    def decide_webhook(
        self,
        agent_id: str,
        tool: str,
        arguments: dict | None = None,
        prompt: str | None = None,
    ) -> Decision:
        """Same decision contract, posted to the webhook alias."""

        payload = self._post(
            "/v1/hooks/decide",
            {
                "agent_id": agent_id,
                "tool": tool,
                "arguments": arguments or {},
                "prompt": prompt,
            },
        )
        return Decision.from_json(payload)
