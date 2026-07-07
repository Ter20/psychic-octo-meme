import httpx

from .. import config


class OmniRouteConnector:
    """Adapter to a live OmniRoute instance (github.com/diegosouzapw/OmniRoute).

    OmniRoute is a self-hosted, OpenAI-compatible AI gateway. By default it
    only listens on http://localhost:20128 on the machine it's installed on
    (per OmniRoute's REMOTE-MODE.md, reaching it from elsewhere requires
    turning on remote mode with a scoped token). A cloud-hosted Mission
    Control instance can only reach it if OmniRoute has been exposed that
    way, or if Mission Control runs on the same machine as OmniRoute.
    """

    name = "omniroute"
    DEFAULT_BASE_URL = "http://localhost:20128"
    DEFAULT_MODEL = "auto"

    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        self.base_url = (base_url or config.OMNIROUTE_API_URL or self.DEFAULT_BASE_URL).rstrip("/")
        self.api_key = api_key or config.OMNIROUTE_API_KEY

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def health(self) -> dict:
        response = httpx.get(f"{self.base_url}/api/monitoring/health", timeout=10)
        response.raise_for_status()
        return response.json()

    def handle(self, task: str) -> str:
        if not self.configured:
            return (
                "OmniRoute is not configured yet. Set OMNIROUTE_API_KEY (from "
                "OmniRoute's Dashboard -> Endpoints) in .env, and if this "
                "Mission Control instance isn't on the same machine as "
                "OmniRoute, also set OMNIROUTE_API_URL to its remote-mode URL."
            )
        response = httpx.post(
            f"{self.base_url}/v1/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.DEFAULT_MODEL,
                "messages": [{"role": "user", "content": task}],
            },
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
