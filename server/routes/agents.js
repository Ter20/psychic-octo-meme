import { Router } from "express";
import { getProfiles, updateProfile, pingProfile } from "../services/modelRouter.js";
import { getUsage } from "../services/usageTracker.js";

export const agentsRouter = Router();

agentsRouter.get("/", async (req, res) => {
  const profiles = await getProfiles();
  const usage = await getUsage();
  const withStatus = await Promise.all(
    profiles.map(async (p) => ({
      ...p,
      ...(await pingProfile(p)),
      usage: usage[p.id] || { calls: 0, inputTokens: 0, outputTokens: 0 },
    }))
  );
  res.json({ profiles: withStatus });
});

agentsRouter.patch("/:id", async (req, res) => {
  try {
    const updated = await updateProfile(req.params.id, req.body);
    res.json({ profile: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

agentsRouter.post("/:id/test", async (req, res) => {
  const profiles = await getProfiles();
  const profile = profiles.find((p) => p.id === req.params.id);
  if (!profile) return res.status(404).json({ error: "not found" });
  const status = await pingProfile(profile);
  res.json(status);
});
