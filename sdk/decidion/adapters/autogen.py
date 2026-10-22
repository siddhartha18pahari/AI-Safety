import json

from decidion.adapters._gate import refuse_unless_allowed


def _safe(value):
    try:
        json.dumps(value)
        return value
    except TypeError:
        return str(value)[:500]


def govern_reply(client, agent_id: str, reply_func):
    """Wrap an AutoGen-style reply function. The wrapped function does not need AutoGen installed."""

    def wrapped(*args, **kwargs):
        decision = client.decide(
            agent_id,
            "autogen.reply",
            {
                "args": [_safe(arg) for arg in args[:4]],
                "kwargs": {key: _safe(value) for key, value in list(kwargs.items())[:8]},
            },
        )
        refuse_unless_allowed(decision)
        return reply_func(*args, **kwargs)

    return wrapped
