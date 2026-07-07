import anthropic

from .connectors.base import Connector

DELEGATE_TOOL = {
    "name": "delegate_task",
    "description": "Delegate a unit of work to one of the connected systems.",
    "input_schema": {
        "type": "object",
        "properties": {
            "route": {"type": "string", "description": "Name of the connected system to delegate to."},
            "task": {"type": "string", "description": "The task to hand off, in plain language."},
        },
        "required": ["route", "task"],
    },
}


class ClaudeCEO:
    """Orchestrator where Claude decides how to delegate a goal across connected systems."""

    def __init__(self, client: anthropic.Anthropic, connectors: dict[str, Connector], model: str):
        self.client = client
        self.connectors = connectors
        self.model = model

    def run(self, goal: str, max_turns: int = 6) -> str:
        system = (
            "You are the CEO of AIX Mission Control. Break the goal into concrete tasks and "
            "delegate each one to the right connected system using the delegate_task tool. "
            f"Connected systems: {', '.join(self.connectors) or 'none yet'}. "
            "Once everything necessary has been delegated, reply with a plain-text summary "
            "and stop calling tools."
        )
        messages = [{"role": "user", "content": goal}]

        for _ in range(max_turns):
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system,
                tools=[DELEGATE_TOOL],
                messages=messages,
            )
            messages.append({"role": "assistant", "content": response.content})

            tool_calls = [block for block in response.content if block.type == "tool_use"]
            if not tool_calls:
                return "".join(block.text for block in response.content if block.type == "text")

            tool_results = []
            for call in tool_calls:
                route = call.input.get("route", "")
                task = call.input.get("task", "")
                connector = self.connectors.get(route)
                if connector is None:
                    result = f"No connector registered for route '{route}'. Available: {list(self.connectors)}"
                else:
                    result = connector.handle(task)
                tool_results.append(
                    {"type": "tool_result", "tool_use_id": call.id, "content": result}
                )
            messages.append({"role": "user", "content": tool_results})

        return "Reached max delegation turns without a final summary."
