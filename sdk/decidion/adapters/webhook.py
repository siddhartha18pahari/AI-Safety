def webhook_body(agent_id: str, tool: str, arguments: dict | None = None, prompt: str | None = None) -> dict:
    """Body for POST /v1/hooks/decide."""

    return {
        "agent_id": agent_id,
        "tool": tool,
        "arguments": arguments or {},
        "prompt": prompt,
    }
