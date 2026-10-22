from pydantic import BaseModel, Field


class AgentIn(BaseModel):
    name: str
    framework: str = "custom"
    tools_allowed: list[str]
    owner: str = "unassigned"
    environment: str = "development"
    industry: str = "general"
    description: str = ""


class DecideIn(BaseModel):
    agent_id: str
    tool: str
    arguments: dict = Field(default_factory=dict)
    prompt: str | None = None
    sandbox: bool = False


class PolicyIn(BaseModel):
    id: str
    name: str
    description: str = ""
    rules: list[dict]


class PolicyPatch(BaseModel):
    enabled: bool


class SwitchPatch(BaseModel):
    enabled: bool | None = None
    threshold: float | None = None


class ResolveIn(BaseModel):
    action: str
    note: str = ""
    resolver: str = ""
