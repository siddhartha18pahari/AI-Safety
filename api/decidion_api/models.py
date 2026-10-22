from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from decidion_api.db import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    framework: Mapped[str] = mapped_column(String(40))
    owner: Mapped[str] = mapped_column(String(80), default="")
    environment: Mapped[str] = mapped_column(String(32), default="development")
    status: Mapped[str] = mapped_column(String(16), default="active")
    industry: Mapped[str] = mapped_column(String(40), default="general")
    description: Mapped[str] = mapped_column(Text, default="")
    tools_allowed: Mapped[list] = mapped_column(JSON)
    baseline_block_rate: Mapped[float] = mapped_column(Float, default=0.05)
    created_at: Mapped[str] = mapped_column(String(40))


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text, default="")
    rules: Mapped[list] = mapped_column(JSON)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    custom: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[str] = mapped_column(String(40))


class KillSwitch(Base):
    __tablename__ = "kill_switches"

    key: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text, default="")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    threshold: Mapped[float | None] = mapped_column(Float, nullable=True)
    trip_count: Mapped[int] = mapped_column(Integer, default=0)
    last_tripped_at: Mapped[str | None] = mapped_column(String(40), nullable=True)


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(40), index=True)
    tool: Mapped[str] = mapped_column(String(80))
    arguments: Mapped[dict] = mapped_column(JSON)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str] = mapped_column(String(16), index=True)
    risk_score: Mapped[int] = mapped_column(Integer)
    latency_ms: Mapped[float] = mapped_column(Float)
    engine_ms: Mapped[float] = mapped_column(Float)
    fast_path: Mapped[bool] = mapped_column(Boolean, default=False)
    sandbox: Mapped[bool] = mapped_column(Boolean, default=False)
    reasons: Mapped[list] = mapped_column(JSON)
    findings: Mapped[list] = mapped_column(JSON)
    redactions: Mapped[list] = mapped_column(JSON)
    policy_ids: Mapped[list] = mapped_column(JSON)
    route: Mapped[str | None] = mapped_column(String(40), nullable=True)
    kill_condition: Mapped[str | None] = mapped_column(String(40), nullable=True)
    killed: Mapped[bool] = mapped_column(Boolean, default=False)
    escalation_id: Mapped[str | None] = mapped_column(String(40), nullable=True)
    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_forwarded: Mapped[int] = mapped_column(Integer, default=0)
    audit_hash: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[str] = mapped_column(String(40), index=True)


class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    decision_id: Mapped[str] = mapped_column(String(40), index=True)
    agent_id: Mapped[str] = mapped_column(String(40), index=True)
    role: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(16), index=True, default="open")
    sla_due_at: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[str] = mapped_column(String(40))
    resolved_at: Mapped[str | None] = mapped_column(String(40), nullable=True)
    resolver: Mapped[str | None] = mapped_column(String(80), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    seq: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    prev_hash: Mapped[str] = mapped_column(String(64))
    hash: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[str] = mapped_column(String(40))


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    agent_id: Mapped[str] = mapped_column(String(40), index=True)
    status: Mapped[str] = mapped_column(String(16))
    passed: Mapped[int] = mapped_column(Integer)
    failed: Mapped[int] = mapped_column(Integer)
    duration_ms: Mapped[float] = mapped_column(Float)
    scenarios: Mapped[list] = mapped_column(JSON)
    created_at: Mapped[str] = mapped_column(String(40))
