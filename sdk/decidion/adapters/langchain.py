from decidion.adapters._gate import refuse_unless_allowed


class GovernedRunnable:
    """Call Decidion before a LangChain-style runnable. No LangChain install required."""

    def __init__(self, client, agent_id: str, inner, tool: str = "langchain.invoke"):
        self.client = client
        self.agent_id = agent_id
        self.inner = inner
        self.tool = tool

    def invoke(self, inputs, **kwargs):
        payload = inputs if isinstance(inputs, dict) else {"input": inputs}
        decision = self.client.decide(self.agent_id, self.tool, payload)
        refuse_unless_allowed(decision)
        return self.inner.invoke(inputs, **kwargs)


def govern_runnable(client, agent_id: str, runnable, tool: str = "langchain.invoke") -> GovernedRunnable:
    return GovernedRunnable(client, agent_id, runnable, tool=tool)
