"""Decidion HTTP API."""

from __future__ import annotations

import asyncio
import contextlib
import hmac
import logging
import os
import random
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from decidion_api.compliance import build_report
from decidion_api.db import SessionLocal, get_db, init_db
from decidion_api.engine.audit import verify_chain
from decidion_api.engine.evaluators import evaluator_catalog
from decidion_api.errors import AgentNotFound, PolicyError
from decidion_api.metrics import finops, snapshot
from decidion_api.models import AuditEvent
from decidion_api.schemas import AgentIn, DecideIn, PolicyIn, PolicyPatch, ResolveIn, SwitchPatch
from decidion_api.seed import SAFE_ACTIONS, seed_if_empty
from decidion_api.service import (
    create_policy,
    govern,
    list_agents,
    list_decisions,
    list_escalations,
    list_evaluations,
    list_policies,
    list_switches,
    register_agent,
    resolve_escalation,
    run_evaluation,
    set_agent_status,
    set_policy_enabled,
    set_switch,
)
from sqlalchemy import select

log = logging.getLogger("decidion")


def require_key(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
) -> None:
    expected = os.environ.get("DECIDION_API_KEY", "ddn_demo_local")
    token = ""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    elif x_api_key:
        token = x_api_key.strip()
    if not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=401, detail="Missing or invalid API key")


async def _live_demo() -> None:
    while True:
        await asyncio.sleep(8)
        agent_id, tool, arguments = random.choice(SAFE_ACTIONS)
        try:
            with SessionLocal() as db:
                from decidion_api.models import Agent

                agent = db.get(Agent, agent_id)
                if agent is not None and agent.status == "active":
                    govern(
                        db,
                        agent_id=agent_id,
                        tool=tool,
                        arguments=arguments,
                        prompt="Live demo tick",
                    )
        except Exception:
            log.exception("live demo tick failed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if os.getenv("DECIDION_SEED", "1") != "0":
        with SessionLocal() as db:
            seed_if_empty(db)
    task = None
    if os.getenv("DECIDION_LIVE_DEMO", "0") == "1":
        task = asyncio.create_task(_live_demo())
    yield
    if task is not None:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


app = FastAPI(
    title="Decidion API",
    version="0.1.0",
    description=(
        "MVP control plane for agent governance. Outcomes are ALLOW, ESCALATE, or BLOCK. "
        "Evaluators are deterministic rules and pattern checks, not production-grade models."
    ),
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AgentNotFound)
async def _missing(_, exc: AgentNotFound):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(PolicyError)
async def _policy(_, exc: PolicyError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.get("/health")
def health():
    return {"status": "ok", "service": "decidion"}


@app.get("/")
def root():
    return {"name": "Decidion", "health": "/health", "docs": "/docs"}


@app.get("/v1/agents", dependencies=[Depends(require_key)])
def get_agents(db: Session = Depends(get_db)):
    return list_agents(db)


@app.post("/v1/agents", dependencies=[Depends(require_key)])
def post_agent(body: AgentIn, db: Session = Depends(get_db)):
    return register_agent(db, **body.model_dump())


@app.post("/v1/agents/{agent_id}/halt", dependencies=[Depends(require_key)])
def post_halt(agent_id: str, db: Session = Depends(get_db)):
    return set_agent_status(db, agent_id, "halted")


@app.post("/v1/agents/{agent_id}/resume", dependencies=[Depends(require_key)])
def post_resume(agent_id: str, db: Session = Depends(get_db)):
    return set_agent_status(db, agent_id, "active")


@app.post("/v1/agents/{agent_id}/evaluations", dependencies=[Depends(require_key)])
def post_evaluation(agent_id: str, db: Session = Depends(get_db)):
    return run_evaluation(db, agent_id)


def _decide(body: DecideIn, db: Session) -> dict:
    return govern(
        db,
        agent_id=body.agent_id,
        tool=body.tool,
        arguments=body.arguments,
        prompt=body.prompt,
        sandbox=body.sandbox,
    )


@app.post("/v1/decide", dependencies=[Depends(require_key)])
def post_decide(body: DecideIn, db: Session = Depends(get_db)):
    return _decide(body, db)


@app.post("/v1/hooks/decide", dependencies=[Depends(require_key)])
def post_hook(body: DecideIn, db: Session = Depends(get_db)):
    return _decide(body, db)


@app.get("/v1/decisions", dependencies=[Depends(require_key)])
def get_decisions(
    agent_id: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return list_decisions(db, agent_id=agent_id, limit=limit)


@app.get("/v1/policies", dependencies=[Depends(require_key)])
def get_policies(db: Session = Depends(get_db)):
    return list_policies(db)


@app.post("/v1/policies", dependencies=[Depends(require_key)])
def post_policy(body: PolicyIn, db: Session = Depends(get_db)):
    return create_policy(db, policy_id=body.id, name=body.name, description=body.description, rules=body.rules)


@app.patch("/v1/policies/{policy_id}", dependencies=[Depends(require_key)])
def patch_policy(policy_id: str, body: PolicyPatch, db: Session = Depends(get_db)):
    return set_policy_enabled(db, policy_id, body.enabled)


@app.get("/v1/kill-switches", dependencies=[Depends(require_key)])
def get_switches(db: Session = Depends(get_db)):
    return list_switches(db)


@app.patch("/v1/kill-switches/{key}", dependencies=[Depends(require_key)])
def patch_switch(key: str, body: SwitchPatch, db: Session = Depends(get_db)):
    return set_switch(db, key, enabled=body.enabled, threshold=body.threshold)


@app.get("/v1/escalations", dependencies=[Depends(require_key)])
def get_escalations(status: str | None = None, db: Session = Depends(get_db)):
    return list_escalations(db, status=status)


@app.post("/v1/escalations/{escalation_id}/resolve", dependencies=[Depends(require_key)])
def post_resolve(escalation_id: str, body: ResolveIn, db: Session = Depends(get_db)):
    return resolve_escalation(db, escalation_id, action=body.action, note=body.note, resolver=body.resolver)


@app.get("/v1/audit", dependencies=[Depends(require_key)])
def get_audit(limit: int = Query(default=50, ge=1, le=500), db: Session = Depends(get_db)):
    rows = db.scalars(select(AuditEvent).order_by(AuditEvent.seq.desc()).limit(limit)).all()
    return [
        {
            "seq": row.seq,
            "event_type": row.event_type,
            "payload": row.payload,
            "prev_hash": row.prev_hash,
            "hash": row.hash,
            "created_at": row.created_at,
        }
        for row in rows
    ]


@app.get("/v1/audit/verify", dependencies=[Depends(require_key)])
def get_verify(db: Session = Depends(get_db)):
    rows = db.scalars(select(AuditEvent).order_by(AuditEvent.seq.asc())).all()
    ok, detail = verify_chain(list(rows))
    return {"ok": ok, "detail": detail, "events": len(rows)}


@app.get("/v1/evaluations", dependencies=[Depends(require_key)])
def get_evaluations(db: Session = Depends(get_db)):
    return list_evaluations(db)


@app.get("/v1/evaluators", dependencies=[Depends(require_key)])
def get_evaluators():
    return evaluator_catalog()


@app.get("/v1/metrics", dependencies=[Depends(require_key)])
def get_metrics(db: Session = Depends(get_db)):
    return snapshot(db)


@app.get("/v1/finops", dependencies=[Depends(require_key)])
def get_finops(db: Session = Depends(get_db)):
    return finops(db)


@app.get("/v1/compliance/reports", dependencies=[Depends(require_key)])
def get_report(framework: str = "SOX", db: Session = Depends(get_db)):
    return build_report(db, framework)
