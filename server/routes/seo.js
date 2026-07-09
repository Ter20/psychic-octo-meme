import { Router } from "express";
import { callModel } from "../services/modelRouter.js";
import { recordUsage } from "../services/usageTracker.js";

export const seoRouter = Router();

// Real Google Search Console OAuth is NOT wired up here (needs a GCP project
// + OAuth consent screen we don't have credentials for in this environment).
// Instead: accept a CSV export from GSC ("Performance > Export") so the rest
// of the pipeline (mapping + brief generation) is real and usable today.
let importedQueries = [];

seoRouter.get("/queries", (req, res) => {
  res.json({ queries: importedQueries, source: importedQueries.length ? "csv_import" : "none" });
});

seoRouter.post("/queries/import", (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  importedQueries = rows
    .filter((r) => r.query)
    .map((r) => ({
      query: String(r.query),
      clicks: Number(r.clicks) || 0,
      impressions: Number(r.impressions) || 0,
      position: Number(r.position) || 0,
    }));
  res.json({ imported: importedQueries.length });
});

const BRIEF_SYSTEM_PROMPT = [
  "You are an SEO content strategist. Given a target keyword and related",
  "queries, produce a short content brief for a writer.",
  'Respond with ONLY JSON: {"title": "...", "outline": ["...", "..."], "informationGainIdeas": ["a unique angle or data point competitors likely miss", "..."]}',
].join("\n");

seoRouter.post("/brief", async (req, res) => {
  const { keyword, relatedQueries = [], builderProfileId = "claude-builder" } = req.body || {};
  if (!keyword) return res.status(400).json({ error: "keyword is required" });
  try {
    const result = await callModel(builderProfileId, {
      system: BRIEF_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Target keyword: ${keyword}\nRelated queries: ${relatedQueries.join(", ")}`,
        },
      ],
    });
    await recordUsage(result.profileId, result.usage);
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    const brief = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: keyword, outline: [], informationGainIdeas: [] };
    res.json({ brief });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Deploy targets: not wired up. These 501 with a clear message instead of
// pretending to publish, since we don't have Netlify/WordPress credentials
// in this environment. Set NETLIFY_AUTH_TOKEN / WORDPRESS_* in .env and
// implement the fetch call here to turn this on for real.
seoRouter.post("/deploy", (req, res) => {
  res.status(501).json({
    error:
      "Deploy target not configured. This is a stub - wire NETLIFY_AUTH_TOKEN or WORDPRESS_BASE_URL/WORDPRESS_APP_PASSWORD in .env and implement the deploy call in server/routes/seo.js.",
  });
});
