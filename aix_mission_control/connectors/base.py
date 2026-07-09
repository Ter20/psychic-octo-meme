from typing import Protocol, runtime_checkable


@runtime_checkable
class Connector(Protocol):
    """A system that Claude, as CEO, can delegate tasks to."""

    name: str

    def handle(self, task: str) -> str:
        """Execute a delegated task and return a plain-text result."""
