# psychic-octo-meme
Going to be successful in this life with AI  and automation c

## AIX Mission Control

Claude-led orchestrator that delegates work across connected systems, starting
with OmniRoute. Claude (the "CEO") receives a goal, decides how to break it up,
and calls a `delegate_task` tool to hand pieces off to whichever connected
system fits — currently just OmniRoute, more can be registered in
`aix_mission_control/connectors/`.

### Fastest path: run it next to your OmniRoute install

OmniRoute only listens on `localhost` by default, so the quickest way to get
a real connection is to run Mission Control on the same machine where
OmniRoute is already live:

```bash
./setup_local.sh   # first run: creates .venv, installs deps, writes .env — fill it in
./setup_local.sh   # second run: starts Mission Control on http://localhost:8000
```

### Manual setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env`:

- `ANTHROPIC_API_KEY` — required, this is what makes Claude the CEO/delegator.
- `OMNIROUTE_API_KEY` — required. Get it from OmniRoute's own dashboard:
  **Dashboard → Endpoints**.
- `OMNIROUTE_API_URL` — where OmniRoute is reachable. Defaults to
  `http://localhost:20128` (OmniRoute's documented default port). That only
  works if Mission Control runs on the **same machine** as OmniRoute. If
  Mission Control runs elsewhere (e.g. a cloud sandbox like this one), you
  must turn on OmniRoute's remote mode (its `REMOTE-MODE.md`: exposing
  OmniRoute remotely with a scoped token) and put that public URL here
  instead — a cloud service cannot reach your machine's `localhost`.

Until `OMNIROUTE_API_KEY` is set, the connector honestly reports itself as
unconfigured instead of pretending to have delegated anything. `GET /health`
also actively pings OmniRoute's real health endpoint
(`/api/monitoring/health`) so you can tell "configured" apart from
"actually reachable."

The connector talks OmniRoute's real, documented API: `POST
/v1/chat/completions` (OpenAI-compatible) with a bearer token — this was
looked up from OmniRoute's own API reference, not guessed.

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
