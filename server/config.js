import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function resolveFromRoot(p) {
  return path.isAbsolute(p) ? p : path.resolve(rootDir, p);
}

export const config = {
  rootDir,
  port: Number(process.env.PORT || 4173),
  vaultPath: resolveFromRoot(process.env.VAULT_PATH || "./vault"),
  workspacePath: resolveFromRoot(process.env.WORKSPACE_PATH || "./workspace"),
  publishedPath: resolveFromRoot(process.env.PUBLISHED_PATH || "./published"),
  loop: {
    passThreshold: Number(process.env.LOOP_PASS_THRESHOLD || 90),
    maxRounds: Number(process.env.LOOP_MAX_ROUNDS || 20),
  },
  providers: {
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || "",
      siteUrl: process.env.OPENROUTER_SITE_URL || "http://localhost:4173",
      appName: process.env.OPENROUTER_APP_NAME || "Agent OS Dashboard",
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    },
  },
};
