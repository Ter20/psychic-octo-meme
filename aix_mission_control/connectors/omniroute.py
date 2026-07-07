import httpx

from .. import config


class OmniRouteConnector:
    """Adapter to a live OmniRoute instance.

    OmniRoute's actual API surface isn't known here, so this speaks the most
    common shape (POST /tasks with a bearer token). Point OMNIROUTE_API_URL
    at the real instance and adjust `handle` if OmniRoute's API differs.
    """

    name = "omniroute"

    def __init__(self, base_url: str | None = None, api_key: str | None = None):
        self.base_url = (base_url or config.OMNIROUTE_API_URL).rstrip("/")
        self.api_key = api_key or config.OMNIROUTE_API_KEY

    @property
    def configured(self) -> bool:
        return bool(self.base_url and self.api_key)

    def handle(self, task: str) -> str:
        if not self.configured:
            return (
                "OmniRoute is not configured yet. Set OMNIROUTE_API_URL and "
                "OMNIROUTE_API_KEY (see .env.example) to point this connector "
                "at your live OmniRoute instance."
            )
        response = httpx.post(
            f"{self.base_url}/tasks",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={"task": task},
            timeout=30,
        )
        response.raise_for_status()
        return response.text
