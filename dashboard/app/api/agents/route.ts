export const dynamic = "force-dynamic";

// Simulated agent status — swap these URLs/logic for real agent endpoints
const AGENTS = [
  {
    id: "openclaw",
    name: "OpenClaw",
    description: "Autonomous reasoning & tool orchestration",
    color: "orange",
    endpoint: process.env.OPENCLAW_URL ?? null,
  },
  {
    id: "hermes",
    name: "Hermes",
    description: "Fast message routing & relay",
    color: "blue",
    endpoint: process.env.HERMES_URL ?? null,
  },
  {
    id: "sentinel",
    name: "Sentinel",
    description: "Security monitoring & anomaly detection",
    color: "green",
    endpoint: process.env.SENTINEL_URL ?? null,
  },
  {
    id: "forge",
    name: "Forge",
    description: "Code generation & refactoring engine",
    color: "purple",
    endpoint: process.env.FORGE_URL ?? null,
  },
];

async function pingAgent(endpoint: string | null): Promise<"online" | "offline" | "unknown"> {
  if (!endpoint) return "unknown";
  try {
    const res = await fetch(`${endpoint}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok ? "online" : "offline";
  } catch {
    return "offline";
  }
}

export async function GET() {
  const results = await Promise.all(
    AGENTS.map(async (agent) => ({
      ...agent,
      status: await pingAgent(agent.endpoint),
      lastSeen: agent.endpoint ? new Date().toISOString() : null,
    }))
  );

  return Response.json({ agents: results, timestamp: new Date().toISOString() });
}
