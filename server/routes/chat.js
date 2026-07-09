import { Router } from "express";
import { callModel } from "../services/modelRouter.js";
import { recordUsage } from "../services/usageTracker.js";
import { assertSafeText } from "../services/safety.js";

export const chatRouter = Router();

const MASTERMIND_SYSTEM_PROMPT = [
  "You are one voice in a multi-agent mastermind chat inside a local Agent OS",
  "dashboard. Answer the user directly and concisely. If other agent replies",
  "are included in the thread, you may build on them, but don't repeat what",
  "was already said.",
].join("\n");

chatRouter.post("/", async (req, res) => {
  const { profileId = "claude-builder", messages = [] } = req.body || {};
  try {
    const result = await callModel(profileId, {
      system: MASTERMIND_SYSTEM_PROMPT,
      messages,
    });
    assertSafeText(result.text);
    await recordUsage(result.profileId, result.usage);
    res.json({ reply: result.text, profileId: result.profileId, usedFallback: result.usedFallback });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
