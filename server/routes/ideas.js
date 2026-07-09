import { Router } from "express";
import { randomUUID } from "node:crypto";
import { jsonStore } from "../services/jsonStore.js";
import { callModel } from "../services/modelRouter.js";
import { recordUsage } from "../services/usageTracker.js";
import { startRun } from "../services/loopEngine.js";

export const ideasRouter = Router();
const store = jsonStore("ideas.json");

const SHAPE_SYSTEM_PROMPT = [
  "You turn a one-line idea into a short build spec for an implementation agent.",
  'Respond with ONLY JSON: {"definitionOfDone": "<2-4 sentences, concrete and testable>"}',
].join("\n");

ideasRouter.get("/", async (req, res) => {
  res.json(await store.read());
});

ideasRouter.post("/", async (req, res) => {
  const board = await store.read();
  const idea = {
    id: randomUUID(),
    title: req.body.title || "Untitled idea",
    stage: "idea_backlog",
    definitionOfDone: null,
    runId: null,
    createdAt: new Date().toISOString(),
  };
  board.ideas.push(idea);
  await store.write(board);
  res.status(201).json({ idea });
});

ideasRouter.patch("/:id", async (req, res) => {
  const board = await store.read();
  const idea = board.ideas.find((i) => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: "not found" });
  Object.assign(idea, req.body);
  await store.write(board);
  res.json({ idea });
});

// "Auto Plan & Shape": calls the Builder model to expand a one-liner into a
// concrete definition of done, then parks the idea at human_approval.
ideasRouter.post("/:id/shape", async (req, res) => {
  const board = await store.read();
  const idea = board.ideas.find((i) => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: "not found" });

  try {
    const builderProfileId = req.body.builderProfileId || "claude-builder";
    const result = await callModel(builderProfileId, {
      system: SHAPE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Idea: ${idea.title}` }],
    });
    await recordUsage(result.profileId, result.usage);
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    idea.definitionOfDone = parsed.definitionOfDone || `Deliver: ${idea.title}`;
    idea.stage = "human_approval";
    await store.write(board);
    res.json({ idea });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Human clicks "approve" in the UI, which calls this to kick off a real
// Builder-Judge loop run for the idea.
ideasRouter.post("/:id/build", async (req, res) => {
  const board = await store.read();
  const idea = board.ideas.find((i) => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: "not found" });
  if (!idea.definitionOfDone) {
    return res.status(400).json({ error: "Idea has not been shaped yet - call /shape first" });
  }

  try {
    const run = await startRun({
      goal: idea.title,
      definitionOfDone: idea.definitionOfDone,
      builderProfileId: req.body.builderProfileId,
      judgeProfileId: req.body.judgeProfileId,
      maxRounds: req.body.maxRounds,
    });
    idea.stage = "build";
    idea.runId = run.id;
    await store.write(board);
    res.status(201).json({ idea, runId: run.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
