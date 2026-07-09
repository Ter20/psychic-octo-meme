import { Router } from "express";
import {
  startRun,
  getRun,
  listRuns,
  subscribeToRun,
  approveRun,
  rejectRun,
} from "../services/loopEngine.js";

export const loopRouter = Router();

loopRouter.get("/", (req, res) => {
  res.json({ runs: listRuns() });
});

loopRouter.post("/start", async (req, res) => {
  try {
    const run = await startRun(req.body || {});
    res.status(201).json({ runId: run.id, status: run.status });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

loopRouter.get("/:id", (req, res) => {
  const run = getRun(req.params.id);
  if (!run) return res.status(404).json({ error: "not found" });
  res.json(run);
});

loopRouter.get("/:id/stream", (req, res) => {
  const run = getRun(req.params.id);
  if (!run) return res.status(404).end();

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Replay what's happened so far so a client that connects mid-run isn't
  // missing history, then keep streaming new events live.
  res.write(`event: snapshot\ndata: ${JSON.stringify(run)}\n\n`);

  const unsubscribe = subscribeToRun(req.params.id, (payload) => {
    res.write(`event: ${payload.event}\ndata: ${JSON.stringify(payload.data)}\n\n`);
  });

  req.on("close", unsubscribe);
});

loopRouter.post("/:id/approve", async (req, res) => {
  try {
    const run = await approveRun(req.params.id);
    res.json({ status: run.status });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

loopRouter.post("/:id/reject", async (req, res) => {
  try {
    const run = await rejectRun(req.params.id, req.body?.reason);
    res.json({ status: run.status });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
