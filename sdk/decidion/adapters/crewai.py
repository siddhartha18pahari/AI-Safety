from decidion.adapters._gate import refuse_unless_allowed


class GovernedCrew:
    """Call Decidion before CrewAI-style kickoff. No CrewAI install required."""

    def __init__(self, client, agent_id: str, crew):
        self.client = client
        self.agent_id = agent_id
        self.crew = crew

    def kickoff(self, inputs=None):
        decision = self.client.decide(self.agent_id, "crewai.kickoff", inputs or {})
        refuse_unless_allowed(decision)
        return self.crew.kickoff(inputs)
