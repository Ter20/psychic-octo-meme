from types import SimpleNamespace

from aix_mission_control.ceo import ClaudeCEO


class StubConnector:
    def __init__(self, name):
        self.name = name
        self.calls = []

    def handle(self, task):
        self.calls.append(task)
        return f"done: {task}"


class StubMessages:
    def __init__(self, responses):
        self._responses = iter(responses)

    def create(self, **kwargs):
        return next(self._responses)


class StubClient:
    def __init__(self, responses):
        self.messages = StubMessages(responses)


def _tool_use_response(route, task, call_id="call_1"):
    block = SimpleNamespace(type="tool_use", id=call_id, input={"route": route, "task": task})
    return SimpleNamespace(content=[block])


def _text_response(text):
    block = SimpleNamespace(type="text", text=text)
    return SimpleNamespace(content=[block])


def test_ceo_delegates_to_registered_connector_then_summarizes():
    omniroute = StubConnector("omniroute")
    responses = [
        _tool_use_response("omniroute", "ping the live instance"),
        _text_response("Delegated one task to OmniRoute."),
    ]
    client = StubClient(responses)
    ceo = ClaudeCEO(client=client, connectors={"omniroute": omniroute}, model="claude-sonnet-5")

    summary = ceo.run("Get OmniRoute connected")

    assert omniroute.calls == ["ping the live instance"]
    assert summary == "Delegated one task to OmniRoute."


def test_ceo_reports_unknown_route_without_crashing():
    responses = [
        _tool_use_response("nonexistent", "do a thing"),
        _text_response("done"),
    ]
    client = StubClient(responses)
    ceo = ClaudeCEO(client=client, connectors={}, model="claude-sonnet-5")

    summary = ceo.run("Try an unregistered system")

    assert summary == "done"
