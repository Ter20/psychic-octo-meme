import anthropic
from fastapi import FastAPI
from pydantic import BaseModel

from . import config
from .ceo import ClaudeCEO
from .connectors.omniroute import OmniRouteConnector

app = FastAPI(title="AIX Mission Control")

omniroute = OmniRouteConnector()
connectors = {omniroute.name: omniroute}

ceo = ClaudeCEO(
    client=anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY),
    connectors=connectors,
    model=config.CLAUDE_MODEL,
)


class DelegateRequest(BaseModel):
    goal: str


def _connector_status(connector) -> dict:
    configured = getattr(connector, "configured", True)
    if not configured:
        return {"configured": False, "reachable": False}
    try:
        connector.health()
        return {"configured": True, "reachable": True}
    except Exception as exc:  # connector unreachable, wrong URL, etc.
        return {"configured": True, "reachable": False, "error": str(exc)}


@app.get("/health")
def health():
    return {
        "status": "up",
        "ceo": "claude",
        "connectors": {name: _connector_status(c) for name, c in connectors.items()},
    }


@app.post("/delegate")
def delegate(request: DelegateRequest):
    summary = ceo.run(request.goal)
    return {"summary": summary}
