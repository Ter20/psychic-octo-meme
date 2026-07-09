import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

const USAGE_FILE = path.resolve(config.rootDir, "server/data/usage.json");

async function load() {
  try {
    return JSON.parse(await fs.readFile(USAGE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

async function save(usage) {
  await fs.writeFile(USAGE_FILE, JSON.stringify(usage, null, 2));
}

export async function recordUsage(profileId, usage = {}) {
  const all = await load();
  const current = all[profileId] || { calls: 0, inputTokens: 0, outputTokens: 0 };
  current.calls += 1;
  current.inputTokens += usage.inputTokens || 0;
  current.outputTokens += usage.outputTokens || 0;
  all[profileId] = current;
  await save(all);
  return current;
}

export async function getUsage() {
  return load();
}
