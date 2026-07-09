import { Router } from "express";
import { randomUUID } from "node:crypto";
import {
  listNotes,
  readNote,
  writeNote,
  searchNotes,
  buildMemoryGraph,
  appendJournal,
  readJournal,
} from "../services/vaultConnector.js";
import { jsonStore } from "../services/jsonStore.js";

export const memoryRouter = Router();
const goalsStore = jsonStore("goals.json");

memoryRouter.get("/notes", async (req, res) => {
  res.json({ notes: await listNotes() });
});

memoryRouter.get("/notes/*", async (req, res) => {
  try {
    res.json({ path: req.params[0], content: await readNote(req.params[0]) });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

memoryRouter.put("/notes/*", async (req, res) => {
  try {
    await writeNote(req.params[0], req.body.content || "");
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

memoryRouter.get("/search", async (req, res) => {
  res.json({ results: await searchNotes(req.query.q || "") });
});

memoryRouter.get("/graph", async (req, res) => {
  res.json(await buildMemoryGraph());
});

memoryRouter.get("/journal", async (req, res) => {
  res.json({ content: await readJournal(req.query.date) });
});

memoryRouter.post("/journal", async (req, res) => {
  const relPath = await appendJournal(req.body.entry || "");
  res.status(201).json({ path: relPath });
});

memoryRouter.get("/goals", async (req, res) => {
  res.json(await goalsStore.read());
});

memoryRouter.post("/goals", async (req, res) => {
  const data = await goalsStore.read();
  const goal = {
    id: randomUUID(),
    text: req.body.text || "",
    done: false,
    createdAt: new Date().toISOString(),
  };
  data.goals.push(goal);
  await goalsStore.write(data);
  res.status(201).json({ goal });
});

memoryRouter.patch("/goals/:id", async (req, res) => {
  const data = await goalsStore.read();
  const goal = data.goals.find((g) => g.id === req.params.id);
  if (!goal) return res.status(404).json({ error: "not found" });
  Object.assign(goal, req.body);
  await goalsStore.write(data);
  res.json({ goal });
});

memoryRouter.delete("/goals/:id", async (req, res) => {
  const data = await goalsStore.read();
  data.goals = data.goals.filter((g) => g.id !== req.params.id);
  await goalsStore.write(data);
  res.status(204).end();
});
