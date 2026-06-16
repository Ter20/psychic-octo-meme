import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const ENV_PATH = join(process.cwd(), ".env.local");

const KNOWN_KEYS = [
  "ANTHROPIC_API_KEY",
  "OPENROUTER_API_KEY",
  "OPENAI_API_KEY",
  "OPENCLAW_GATEWAY_TOKEN",
  "OPENCLAW_GATEWAY_PORT",
  "OBSIDIAN_VAULT",
  "ANTHROPIC_MODEL",
  "HERMES_MODEL",
];

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return result;
}

function serializeEnvFile(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n";
}

function mask(val: string): string {
  if (!val || val.length < 8) return val ? "••••••••" : "";
  return val.slice(0, 8) + "••••••••";
}

export async function GET() {
  let existing: Record<string, string> = {};
  try {
    existing = parseEnvFile(await readFile(ENV_PATH, "utf-8"));
  } catch {
    // file doesn't exist yet
  }

  // Merge with live process.env for display
  const result: Record<string, { masked: string; set: boolean }> = {};
  for (const key of KNOWN_KEYS) {
    const val = existing[key] ?? process.env[key] ?? "";
    result[key] = { masked: mask(val), set: Boolean(val) };
  }

  return Response.json({ keys: result });
}

export async function POST(req: Request) {
  const { key, value } = await req.json();

  if (!key || typeof key !== "string" || !KNOWN_KEYS.includes(key)) {
    return Response.json({ error: "Invalid key" }, { status: 400 });
  }

  let existing: Record<string, string> = {};
  try {
    existing = parseEnvFile(await readFile(ENV_PATH, "utf-8"));
  } catch {
    // will create fresh
  }

  if (value && typeof value === "string" && value.trim()) {
    existing[key] = value.trim();
  } else {
    delete existing[key];
  }

  try {
    await writeFile(ENV_PATH, serializeEnvFile(existing), "utf-8");
    return Response.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
