# Agent OS Dashboard

A local "Agent Operating System" dashboard: one screen that unifies a fleet
of AI model profiles, a self-correcting Builder-Judge loop engine, Kanban and
Idea pipelines, and a plain-Markdown Obsidian vault for shared memory.

Runs entirely on your machine — plain HTML/CSS/vanilla JS frontend, one
Express backend, no build step, no database.

## What's actually real vs. a stub

Everything below is a genuinely working feature, runnable with **zero API
keys** thanks to a built-in mock model provider:

- **Builder-Judge loop engine** — the core feature. Give it a goal and a
  definition of done, it round-trips between a Builder profile (writes files)
  and a Judge profile (grades 0-100, writes a critique) until the score
  clears the pass threshold (default 90) or it runs out of rounds — then it
  stops and waits for a human to click Approve before anything is
  "published." Streams live via Server-Sent Events.
- **Model fallback chains** — every agent profile lists fallback profile ids.
  If a provider errors or isn't configured, the router walks the chain
  automatically so a long run survives a rate limit instead of dying.
- **Kanban Swarm Board** — drag-and-drop cards across Backlog / Triage /
  Active / Blocked / Done, persisted to `server/data/kanban.json`.
- **Idea Pipeline** — Idea Backlog → Auto Plan & Shape (a real LLM call
  expands a one-liner into a definition of done) → Human Approval → Build
  (kicks off a real loop run, with a live log and a live-preview link to the
  files the Builder wrote) → Done.
- **Obsidian-style vault memory** — `vault/` uses the PARA folders
  (Projects/Areas/Resources/Archives) plus a `journal/` dir. Every passed run
  gets logged to `vault/PARA/Archives/run-<id>.md` automatically. The
  dashboard can read, search, and append to these plain `.md` files, and
  renders a simple wikilink graph ("Memory Galaxy").
- **Voice** — uses the browser's built-in Web Speech API (SpeechRecognition +
  SpeechSynthesis) directly, no external service or key needed. Works in
  Chromium-based browsers.
- **Safety hooks** — the Builder can only write files inside its run's
  sandbox directory (path-traversal is rejected), and any output matching a
  destructive-command pattern (`rm -rf /`, force-push, `DROP TABLE`, fork
  bombs, etc.) halts the run instead of being written out. Publishing always
  stops for human approval — there is no "auto-publish" switch.

### Deliberately stubbed (needs credentials this environment doesn't have)

- **Google Search Console integration** — real OAuth needs a GCP project +
  consent screen. The SEO tab instead accepts a pasted CSV export
  (`query,clicks,impressions,position`), and keyword→brief generation on top
  of that data is real (calls your configured Builder model).
- **Netlify / WordPress deploy** — `POST /api/seo/deploy` returns 501 with a
  clear message. Wire `NETLIFY_AUTH_TOKEN` or `WORDPRESS_BASE_URL` /
  `WORDPRESS_APP_PASSWORD` in `.env` and implement the fetch call in
  `server/routes/seo.js` to turn this on.
- **Hermes / GLM / Gemini** model profiles are pre-wired to call them via
  OpenRouter — set `OPENROUTER_API_KEY` and they work; without a key they
  fall back down the chain to the mock provider.
- **Token compression (Headroom/RTK-style)** — not implemented. The hook
  point is `server/services/modelRouter.js` — compress `messages` before
  they're sent to a provider if you want this.

## Setup

```bash
npm install
cp .env.example .env   # fill in whatever API keys you have; all optional
npm start               # http://localhost:4173
```

Open `http://localhost:4173`. With no `.env` keys set, the whole dashboard —
including full Builder-Judge loop runs — works immediately against the mock
provider so you can see the architecture end to end before spending any
API credits.

To use real models, set in `.env`:
- `ANTHROPIC_API_KEY` for the Claude profiles
- `OPENROUTER_API_KEY` for Hermes / GLM / Gemini (routed through OpenRouter)
- `OLLAMA_BASE_URL` (defaults to `http://localhost:11434`) for a local Ollama
  model — start Ollama separately and enable the `ollama-builder` profile in
  the sidebar.

## Project layout

```
server/
  index.js              Express app, static file + preview serving
  config.js              env-driven config
  data/                  JSON "database" (agents, kanban, ideas, goals)
  prompts/                @Builder / @Judge / @Publisher system prompts
  services/
    modelRouter.js        provider dispatch + fallback chain
    loopEngine.js          the Builder-Judge loop itself
    vaultConnector.js      reads/writes the Obsidian-style vault
    safety.js              destructive-action + sandbox-path guards
    usageTracker.js        per-profile token/call counters
  routes/                  one file per API area (agents, loop, kanban, ideas, memory, chat, seo)
public/                    frontend - plain HTML/CSS/vanilla JS, no build step
vault/                     your local PARA-method Markdown vault (point Obsidian at this folder)
workspace/runs/<id>/files  sandbox each loop run's Builder writes into
published/<id>/            where an approved run's files get copied after human approval
```

## Editing the agent fleet

Agent profiles live in `server/data/agents.json` (id, provider, model,
role, enabled, fallback chain). Toggle enabled/disabled from the sidebar, or
edit the file directly and restart.

## A note on scope

The original brief called for things like a full GSC OAuth pipeline and
one-click Netlify/WordPress publishing. Those need real third-party
credentials that don't exist in this environment, so rather than fake them,
this build makes the core mechanism — the Builder-Judge loop, the fallback
routing, the safety gates, the vault memory — genuinely functional, and
leaves the external integrations as clearly labeled stub endpoints with the
exact file/line to extend when you have those credentials.
