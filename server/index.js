import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { config } from "./config.js";
import { agentsRouter } from "./routes/agents.js";
import { loopRouter } from "./routes/loop.js";
import { kanbanRouter } from "./routes/kanban.js";
import { ideasRouter } from "./routes/ideas.js";
import { memoryRouter } from "./routes/memory.js";
import { chatRouter } from "./routes/chat.js";
import { seoRouter } from "./routes/seo.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.use("/api/agents", agentsRouter);
app.use("/api/loop", loopRouter);
app.use("/api/kanban", kanbanRouter);
app.use("/api/ideas", ideasRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/chat", chatRouter);
app.use("/api/seo", seoRouter);

// Live Preview Gallery: serves whatever a run's Builder has written so far
// (or the human-approved final copy) as static files.
app.use("/preview/runs", express.static(path.join(config.workspacePath, "runs")));
app.use("/preview/published", express.static(config.publishedPath));

app.use(express.static(path.resolve(config.rootDir, "public")));

app.get("/healthz", (req, res) => res.json({ ok: true }));

async function ensureDirs() {
  await fs.mkdir(config.vaultPath, { recursive: true });
  await fs.mkdir(config.workspacePath, { recursive: true });
  await fs.mkdir(config.publishedPath, { recursive: true });
}

await ensureDirs();

app.listen(config.port, () => {
  console.log(`Agent OS dashboard running at http://localhost:${config.port}`);
});
