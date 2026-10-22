from decidion.client import DecidionBlocked, DecidionEscalated, Decision


def refuse_unless_allowed(decision: Decision) -> None:
    if decision.outcome == "BLOCK":
        raise DecidionBlocked(decision)
    if decision.outcome == "ESCALATE":
        raise DecidionEscalated(decision)
