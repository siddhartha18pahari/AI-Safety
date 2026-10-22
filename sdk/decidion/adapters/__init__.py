"""Framework adapters. They refuse the wrapped call unless the outcome is ALLOW."""

from decidion.adapters.autogen import govern_reply
from decidion.adapters.crewai import GovernedCrew
from decidion.adapters.langchain import GovernedRunnable, govern_runnable
from decidion.adapters.langgraph import govern_node
from decidion.adapters.webhook import webhook_body

__all__ = [
    "GovernedCrew",
    "GovernedRunnable",
    "govern_node",
    "govern_reply",
    "govern_runnable",
    "webhook_body",
]
