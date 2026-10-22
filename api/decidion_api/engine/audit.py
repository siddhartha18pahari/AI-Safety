"""Application-level hash chain. A database admin can still rewrite rows."""

from __future__ import annotations

import copy
import hashlib
import json
import threading

from sqlalchemy import select
from sqlalchemy.orm import Session

from decidion_api.engine.types import GENESIS
from decidion_api.models import AuditEvent

audit_lock = threading.Lock()


def canonical(payload: dict) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)


def chain_hash(prev: str, seq: int, event_type: str, payload: dict, created_at: str) -> str:
    body = canonical(
        {
            "prev": prev,
            "seq": seq,
            "event_type": event_type,
            "payload": payload,
            "created_at": created_at,
        }
    )
    return hashlib.sha256(body.encode()).hexdigest()


def append_audit(db: Session, event_type: str, payload: dict, created_at: str) -> AuditEvent:
    """Insert the next event. Caller must hold audit_lock and commit."""

    last = db.execute(select(AuditEvent).order_by(AuditEvent.seq.desc()).limit(1)).scalar_one_or_none()
    seq = 1 if last is None else last.seq + 1
    prev = GENESIS if last is None else last.hash
    stored = copy.deepcopy(payload)
    digest = chain_hash(prev, seq, event_type, stored, created_at)
    row = AuditEvent(
        seq=seq,
        event_type=event_type,
        payload=stored,
        prev_hash=prev,
        hash=digest,
        created_at=created_at,
    )
    db.add(row)
    db.flush()
    return row


def verify_chain(events: list[AuditEvent]) -> tuple[bool, str | None]:
    prev = GENESIS
    for event in events:
        if event.prev_hash != prev:
            return False, f"Previous hash break at seq {event.seq}"
        expected = chain_hash(event.prev_hash, event.seq, event.event_type, event.payload, event.created_at)
        if expected != event.hash:
            return False, f"Hash mismatch at seq {event.seq}"
        prev = event.hash
    return True, None
