# psychic-octo-meme
Going to be successful in this life with AI  and automation c

## AIX Mission Control

Claude-led orchestrator that delegates work across connected systems, starting
with OmniRoute. Claude (the "CEO") receives a goal, decides how to break it up,
and calls a `delegate_task` tool to hand pieces off to whichever connected
system fits — currently just OmniRoute, more can be registered in
`aix_mission_control/connectors/`.

### Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env`:

- `ANTHROPIC_API_KEY` — required, this is what makes Claude the CEO/delegator.
- `OMNIROUTE_API_URL` / `OMNIROUTE_API_KEY` — point these at your live
  OmniRoute instance. Until both are set, the OmniRoute connector responds
  honestly that it isn't configured instead of pretending to have delegated
  anything.

  OmniRoute's actual API contract isn't known yet — the connector
  (`aix_mission_control/connectors/omniroute.py`) currently assumes a
  `POST {OMNIROUTE_API_URL}/tasks` endpoint with a bearer token. If OmniRoute's
  real API looks different (different auth, different routes), update
  `OmniRouteConnector.handle` to match.

### Run

```bash
python -m aix_mission_control.main
```

Serves on `http://localhost:8000`:

- `GET /health` — reports whether Claude is wired up and whether each
  connector (e.g. OmniRoute) is actually configured.
- `POST /delegate` — `{"goal": "..."}`, Claude breaks it down and delegates
  across connected systems, returns a summary.

### Test

```bash
pip install pytest
pytest tests/
```
