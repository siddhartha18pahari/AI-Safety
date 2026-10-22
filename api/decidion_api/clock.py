from datetime import datetime, timezone


def utcnow() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def parse_ts(value: str) -> datetime:
    return datetime.fromisoformat(value)
