# psychic-octo-meme
Going to be successful in this life with AI and automation 🚀

---

# Mission Control — AI Command Center

A beautiful, dopamine-inducing local dashboard for managing Claude and your AI agents.

**Stack:** Next.js App Router · Tailwind CSS · Framer Motion · Claude Code CLI

---

## Features

- **Claude chat panel** — real-time streaming via Claude Code CLI bridge (SSE)
- **Multi-agent grid** — OpenClaw, Hermes, Sentinel, Forge with expandable mini-terminals
- **Live activity feed** — event log for all system activity
- **Aurora background** — animated nebula blobs, perspective grid, scanlines
- **Glassmorphism UI** — dark space aesthetic with neon glow accents

---

## Quick Start

### 1. Install Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
claude auth          # authenticate once
```

### 2. Run the dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open **http://localhost:3000**

### 3. Connect your agents (optional)

```bash
cp dashboard/.env.local.example dashboard/.env.local
```

Edit `.env.local`:

```env
OPENCLAW_URL=http://localhost:4001
HERMES_URL=http://localhost:4002
SENTINEL_URL=http://localhost:4003
FORGE_URL=http://localhost:4004
```

Each agent needs a `GET /health` endpoint that returns HTTP 200.

---

## How the Claude CLI bridge works

`POST /api/claude` spawns `claude --print --output-format stream-json` and pipes
the JSON event stream back as SSE. The browser reads it with `ReadableStream`.
Sessions are preserved across messages with `--resume <session_id>`.

---

## Structure

```
dashboard/
  app/
    api/claude/route.ts   ← Claude CLI → SSE bridge
    api/agents/route.ts   ← Agent health polling
    page.tsx              ← Mission control page
    globals.css           ← Aurora / glass / glow styles
  components/
    AuroraBackground.tsx  ← Animated nebula + grid
    SystemHeader.tsx      ← Top bar with live status
    ClaudePanel.tsx       ← Chat UI + streaming
    AgentGrid.tsx         ← Agent cards + mini-terminals
    ActivityFeed.tsx      ← Live event log
    QuickStats.tsx        ← Counter widgets
```
