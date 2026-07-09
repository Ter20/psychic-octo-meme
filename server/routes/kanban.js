import { Router } from "express";
import { randomUUID } from "node:crypto";
import { jsonStore } from "../services/jsonStore.js";

export const kanbanRouter = Router();
const store = jsonStore("kanban.json");

kanbanRouter.get("/", async (req, res) => {
  res.json(await store.read());
});

kanbanRouter.post("/cards", async (req, res) => {
  const board = await store.read();
  const card = {
    id: randomUUID(),
    title: req.body.title || "Untitled",
    column: req.body.column || "backlog",
    assignee: req.body.assignee || null,
    runId: req.body.runId || null,
    createdAt: new Date().toISOString(),
  };
  board.cards.push(card);
  await store.write(board);
  res.status(201).json({ card });
});

kanbanRouter.patch("/cards/:id", async (req, res) => {
  const board = await store.read();
  const card = board.cards.find((c) => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: "not found" });
  Object.assign(card, req.body);
  await store.write(board);
  res.json({ card });
});

kanbanRouter.delete("/cards/:id", async (req, res) => {
  const board = await store.read();
  board.cards = board.cards.filter((c) => c.id !== req.params.id);
  await store.write(board);
  res.status(204).end();
});
