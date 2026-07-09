import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

const AGENTS_FILE = path.resolve(config.rootDir, "server/data/agents.json");

export async function getProfiles() {
  const raw = await fs.readFile(AGENTS_FILE, "utf-8");
  return JSON.parse(raw).profiles;
}

export async function saveProfiles(profiles) {
  await fs.writeFile(AGENTS_FILE, JSON.stringify({ profiles }, null, 2));
  return profiles;
}

export async function getProfile(id) {
  const profiles = await getProfiles();
  const profile = profiles.find((p) => p.id === id);
  if (!profile) throw new Error(`Unknown agent profile: ${id}`);
  return profile;
}

export async function updateProfile(id, patch) {
  const profiles = await getProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Unknown agent profile: ${id}`);
  profiles[idx] = { ...profiles[idx], ...patch };
  await saveProfiles(profiles);
  return profiles[idx];
}

function isConfigured(provider) {
  if (provider === "mock") return true;
  if (provider === "anthropic") return Boolean(config.providers.anthropic.apiKey);
  if (provider === "openrouter") return Boolean(config.providers.openrouter.apiKey);
  if (provider === "ollama") return true; // local, assume reachable until proven otherwise
  return false;
}

async function pingOllama() {
  try {
    const res = await fetch(`${config.providers.ollama.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pingProfile(profile) {
  if (!profile.enabled) return { status: "disabled" };
  if (profile.provider === "mock") return { status: "online" };
  if (!isConfigured(profile.provider)) return { status: "unconfigured" };
  if (profile.provider === "ollama") {
    const ok = await pingOllama();
    return { status: ok ? "online" : "offline" };
  }
  // Anthropic / OpenRouter: presence of an API key counts as "configured".
  // We don't burn a real request on every sidebar refresh - use "Test Connection" for that.
  return { status: "configured" };
}

async function callAnthropic(profile, { system, messages, maxTokens }) {
  const started = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.providers.anthropic.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: profile.model,
      max_tokens: maxTokens || 4096,
      system,
      messages,
    }),
  });
  if (!res.ok) {
    throw new Error(`anthropic ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const text = (data.content || []).map((b) => b.text || "").join("\n");
  return {
    text,
    usage: {
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
    },
    latencyMs: Date.now() - started,
  };
}

async function callOpenRouter(profile, { system, messages, maxTokens }) {
  const started = Date.now();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.providers.openrouter.apiKey}`,
      "HTTP-Referer": config.providers.openrouter.siteUrl,
      "X-Title": config.providers.openrouter.appName,
    },
    body: JSON.stringify({
      model: profile.model,
      max_tokens: maxTokens || 4096,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) {
    throw new Error(`openrouter ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  return {
    text,
    usage: {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
    },
    latencyMs: Date.now() - started,
  };
}

async function callOllama(profile, { system, messages, maxTokens }) {
  const started = Date.now();
  const res = await fetch(`${config.providers.ollama.baseUrl}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: profile.model,
      messages: [{ role: "system", content: system }, ...messages],
      stream: false,
      options: { num_predict: maxTokens || 4096 },
    }),
  });
  if (!res.ok) {
    throw new Error(`ollama ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return {
    text: data.message?.content || "",
    usage: {
      inputTokens: data.prompt_eval_count || 0,
      outputTokens: data.eval_count || 0,
    },
    latencyMs: Date.now() - started,
  };
}

// Deterministic, zero-dependency stand-in so the whole dashboard (including the
// Builder-Judge loop) is demoable with no API keys configured at all. Judge
// scores ramp up round over round so a demo run actually converges and stops.
async function callMock(profile, { messages }) {
  const roundMatch = JSON.stringify(messages).match(/Round:?\s*(\d+)/i);
  const round = roundMatch ? Number(roundMatch[1]) : 1;
  const isJudge = profile.role === "judge" || /judge/i.test(profile.id);
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

  if (isJudge) {
    const score = Math.min(60 + round * 12, 100);
    const verdict =
      score >= config.loop.passThreshold
        ? "Meets the definition of done. Approving for publish."
        : "Missing details / needs another pass - see critique.";
    return {
      text: JSON.stringify(
        {
          score,
          critique:
            score >= config.loop.passThreshold
              ? "Looks solid. No blocking issues found."
              : `[mock judge] Round ${round}: tighten copy, add the missing section, and double-check edge cases. ${verdict}`,
        },
        null,
        2
      ),
      usage: { inputTokens: 120, outputTokens: 80 },
      latencyMs: 250,
    };
  }

  return {
    text: [
      "```file:draft.md",
      `# Draft (mock builder, round ${round})`,
      "",
      "This is a placeholder draft produced by the mock provider because no",
      "real model API key is configured. Set ANTHROPIC_API_KEY, OPENROUTER_API_KEY,",
      "or point OLLAMA_BASE_URL at a running Ollama instance to get real output.",
      "```",
    ].join("\n"),
    usage: { inputTokens: 200, outputTokens: 150 },
    latencyMs: 300,
  };
}

async function dispatch(profile, args) {
  switch (profile.provider) {
    case "anthropic":
      return callAnthropic(profile, args);
    case "openrouter":
      return callOpenRouter(profile, args);
    case "ollama":
      return callOllama(profile, args);
    case "mock":
    default:
      return callMock(profile, args);
  }
}

// Tries the requested profile, then walks its configured fallback chain in
// order so a long-running loop survives a rate limit or an outage instead of
// dying mid-run.
export async function callModel(profileId, args) {
  const profiles = await getProfiles();
  const chain = [profileId, ...(profiles.find((p) => p.id === profileId)?.fallbacks || [])];
  const errors = [];

  for (const id of chain) {
    const profile = profiles.find((p) => p.id === id);
    if (!profile || !profile.enabled) continue;
    if (profile.provider !== "mock" && !isConfigured(profile.provider)) {
      errors.push(`${id}: not configured`);
      continue;
    }
    try {
      const result = await dispatch(profile, args);
      return { ...result, profileId: id, usedFallback: id !== profileId };
    } catch (err) {
      errors.push(`${id}: ${err.message}`);
    }
  }

  throw new Error(`All providers in chain exhausted for "${profileId}": ${errors.join(" | ")}`);
}
