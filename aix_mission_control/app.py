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


@app.get("/health")
def health():
    return {
        "status": "up",
        "ceo": "claude",
        "connectors": {name: getattr(c, "configured", True) for name, c in connectors.items()},
    }


@app.post("/delegate")
def delegate(request: DelegateRequest):
    summary = ceo.run(request.goal)
    return {"summary": summary}
