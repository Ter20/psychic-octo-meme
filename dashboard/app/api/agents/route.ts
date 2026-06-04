export const dynamic = "force-dynamic";

function openclawBase() {
  const port = process.env.OPENCLAW_GATEWAY_PORT ?? "18789";
  return `http://127.0.0.1:${port}`;
}

const AGENTS = [
  { id: "openclaw", name: "OpenClaw", description: "Autonomous reasoning & tool orchestration", color: "orange" },
  { id: "hermes",   name: "Hermes",   description: "Fast message routing & relay",              color: "blue"   },
  { id: "sentinel", name: "Sentinel", description: "Security monitoring & anomaly detection",   color: "green"  },
  { id: "forge",    name: "Forge",    description: "Code generation & refactoring engine",      color: "purple" },
];

async function pingAgent(id: string): Promise<"online" | "offline" | "unknown"> {
  try {
    if (id === "openclaw") {
      const token = process.env.OPENCLAW_GATEWAY_TOKEN;
      const res = await fetch(`${openclawBase()}/v1/models`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(2000),
      });
      return res.ok ? "online" : "offline";
    }

    // Generic agents: need an env var URL
    const envKey = `${id.toUpperCase()}_URL`;
    const endpoint = process.env[envKey];
    if (!endpoint) return "unknown";
    const res = await fetch(`${endpoint}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok ? "online" : "offline";
  } catch {
    return id === "openclaw" ? "offline" : "unknown";
  }
}

export async function GET() {
  const results = await Promise.all(
    AGENTS.map(async (agent) => ({
      ...agent,
      status: await pingAgent(agent.id),
      lastSeen: new Date().toISOString(),
    }))
  );

  return Response.json({ agents: results, timestamp: new Date().toISOString() });
}
