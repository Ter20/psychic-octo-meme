export const dynamic = "force-dynamic";

const AGENTS = [
  { id: "openclaw",  name: "OpenClaw",  description: "Autonomous reasoning & tool orchestration", color: "orange", type: "openclaw"    },
  { id: "hermes",    name: "Hermes",    description: "NousResearch Hermes via OpenRouter",         color: "blue",   type: "openrouter"  },
  { id: "sentinel",  name: "Sentinel",  description: "GPT-4o via OpenAI",                          color: "green",  type: "openai"      },
  { id: "forge",     name: "Forge",     description: "o3-mini via OpenAI",                         color: "purple", type: "openai"      },
];

async function pingAgent(id: string, type: string): Promise<"online" | "offline" | "unknown"> {
  try {
    if (type === "openclaw") {
      const port = process.env.OPENCLAW_GATEWAY_PORT ?? "18789";
      const token = process.env.OPENCLAW_GATEWAY_TOKEN;
      const res = await fetch(`http://127.0.0.1:${port}/v1/models`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(2000),
      });
      return res.ok ? "online" : "offline";
    }

    if (type === "openrouter") {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) return "unknown";
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(4000),
      });
      return res.ok ? "online" : "offline";
    }

    if (type === "openai") {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return "unknown";
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(4000),
      });
      return res.ok ? "online" : "offline";
    }

    const envKey = `${id.toUpperCase()}_URL`;
    const endpoint = process.env[envKey];
    if (!endpoint) return "unknown";
    const res = await fetch(`${endpoint}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok ? "online" : "offline";
  } catch {
    return type === "openclaw" ? "offline" : "unknown";
  }
}

export async function GET() {
  const results = await Promise.all(
    AGENTS.map(async (agent) => ({
      ...agent,
      status: await pingAgent(agent.id, agent.type),
      lastSeen: new Date().toISOString(),
    }))
  );

  return Response.json({ agents: results, timestamp: new Date().toISOString() });
}
