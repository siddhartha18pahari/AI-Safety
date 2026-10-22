from decidion.adapters._gate import refuse_unless_allowed


def govern_node(client, agent_id: str, tool_name: str, fn):
    """Wrap a LangGraph-style node. The node only runs after ALLOW."""

    def node(state):
        payload = state if isinstance(state, dict) else {"state": str(state)[:500]}
        decision = client.decide(agent_id, tool_name, payload)
        refuse_unless_allowed(decision)
        return fn(state)

    return node
