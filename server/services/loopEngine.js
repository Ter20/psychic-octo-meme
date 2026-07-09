import fs from "node:fs/promises";
import path from "node:path";
import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { callModel } from "./modelRouter.js";
import { assertSafeText, assertPathWithinSandbox, DestructiveActionError } from "./safety.js";
import { appendRunSummary } from "./vaultConnector.js";
import { recordUsage } from "./usageTracker.js";

const PROMPTS_DIR = path.resolve(config.rootDir, "server/prompts");
const FILE_BLOCK_RE = /```file:([^\n`]+)\n([\s\S]*?)```/g;

const runs = new Map(); // runId -> run state
const emitters = new Map(); // runId -> EventEmitter

async function loadPrompt(name) {
  return fs.readFile(path.join(PROMPTS_DIR, name), "utf-8");
}

function emit(runId, event, data) {
  const emitter = emitters.get(runId);
  if (emitter) emitter.emit("event", { event, data, at: new Date().toISOString() });
}

function log(run, line) {
  const entry = { at: new Date().toISOString(), line };
  run.log.push(entry);
  emit(run.id, "log", entry);
}

function extractFiles(builderText) {
  const files = [];
  let match;
  FILE_BLOCK_RE.lastIndex = 0;
  while ((match = FILE_BLOCK_RE.exec(builderText)) !== null) {
    files.push({ path: match[1].trim(), content: match[2] });
  }
  return files;
}

function parseJudgeVerdict(judgeText) {
  const jsonMatch = judgeText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { score: 0, critique: `Judge did not return parseable JSON:\n${judgeText}` };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Number(parsed.score) || 0,
      critique: String(parsed.critique || ""),
    };
  } catch {
    return { score: 0, critique: `Judge JSON failed to parse:\n${judgeText}` };
  }
}

async function writeFiles(sandboxDir, files) {
  const written = [];
  for (const file of files) {
    const target = assertPathWithinSandbox(sandboxDir, file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.content, "utf-8");
    written.push(file.path);
  }
  return written;
}

async function readCurrentFiles(sandboxDir) {
  let entries;
  try {
    entries = await fs.readdir(sandboxDir, { withFileTypes: true, recursive: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (entry.isFile()) {
      const rel = path.relative(sandboxDir, path.join(entry.parentPath || entry.path, entry.name));
      const content = await fs.readFile(path.join(sandboxDir, rel), "utf-8").catch(() => "");
      files.push({ path: rel, content });
    }
  }
  return files;
}

export function getRun(runId) {
  return runs.get(runId);
}

export function listRuns() {
  return Array.from(runs.values()).map((r) => ({
    id: r.id,
    goal: r.goal,
    status: r.status,
    round: r.round,
    maxRounds: r.maxRounds,
    bestScore: r.bestScore,
    createdAt: r.createdAt,
  }));
}

export function subscribeToRun(runId, listener) {
  let emitter = emitters.get(runId);
  if (!emitter) {
    emitter = new EventEmitter();
    emitter.setMaxListeners(50);
    emitters.set(runId, emitter);
  }
  emitter.on("event", listener);
  return () => emitter.off("event", listener);
}

export async function startRun({
  goal,
  definitionOfDone,
  builderProfileId = "claude-builder",
  judgeProfileId = "claude-judge",
  maxRounds = config.loop.maxRounds,
  passThreshold = config.loop.passThreshold,
}) {
  if (!goal || !definitionOfDone) {
    throw new Error("goal and definitionOfDone are required");
  }

  const runId = randomUUID();
  const sandboxDir = path.join(config.workspacePath, "runs", runId, "files");
  await fs.mkdir(sandboxDir, { recursive: true });

  const run = {
    id: runId,
    goal,
    definitionOfDone,
    builderProfileId,
    judgeProfileId,
    maxRounds,
    passThreshold,
    round: 0,
    status: "running",
    bestScore: 0,
    sandboxDir,
    log: [],
    rounds: [],
    createdAt: new Date().toISOString(),
  };
  runs.set(runId, run);
  emitters.set(runId, new EventEmitter());

  log(run, `Run started. Goal: "${goal}". Definition of done: "${definitionOfDone}".`);
  executeLoop(run).catch((err) => {
    run.status = "error";
    log(run, `Fatal error: ${err.message}`);
    emit(runId, "status", { status: "error" });
  });

  return run;
}

async function executeLoop(run) {
  const builderPromptTemplate = await loadPrompt("builder.md");
  const judgePromptTemplate = await loadPrompt("judge.md");

  let critique = null;

  for (let round = 1; round <= run.maxRounds; round += 1) {
    run.round = round;
    emit(run.id, "status", { status: "running", round });

    const existingFiles = await readCurrentFiles(run.sandboxDir);
    const builderUserMessage = [
      `Round ${round} of ${run.maxRounds}.`,
      `Goal: ${run.goal}`,
      `Definition of done: ${run.definitionOfDone}`,
      critique ? `\nJudge critique from the previous round (fix these issues):\n${critique}` : "",
      existingFiles.length
        ? `\nCurrent files in the workspace:\n${existingFiles
            .map((f) => `--- ${f.path} ---\n${f.content}`)
            .join("\n\n")}`
        : "\nNo files exist yet - this is the first draft.",
    ].join("\n");

    log(run, `Round ${round}: calling Builder (${run.builderProfileId})...`);
    let builderResult;
    try {
      builderResult = await callModel(run.builderProfileId, {
        system: builderPromptTemplate,
        messages: [{ role: "user", content: builderUserMessage }],
      });
    } catch (err) {
      log(run, `Builder call failed: ${err.message}`);
      run.status = "error";
      emit(run.id, "status", { status: "error" });
      return;
    }
    await recordUsage(builderResult.profileId, builderResult.usage);
    if (builderResult.usedFallback) {
      log(run, `Builder fell back to "${builderResult.profileId}".`);
    }

    try {
      assertSafeText(builderResult.text);
    } catch (err) {
      if (err instanceof DestructiveActionError) {
        log(run, `BLOCKED: Builder output matched a destructive-action pattern (${err.matchedPattern}). Halting run.`);
        run.status = "blocked";
        emit(run.id, "status", { status: "blocked" });
        return;
      }
      throw err;
    }

    const files = extractFiles(builderResult.text);
    let written = [];
    try {
      written = await writeFiles(run.sandboxDir, files);
    } catch (err) {
      log(run, `BLOCKED: ${err.message}`);
      run.status = "blocked";
      emit(run.id, "status", { status: "blocked" });
      return;
    }
    log(run, `Builder wrote ${written.length} file(s): ${written.join(", ") || "(none)"}`);

    const currentFiles = await readCurrentFiles(run.sandboxDir);
    const judgeUserMessage = [
      `Goal: ${run.goal}`,
      `Definition of done: ${run.definitionOfDone}`,
      `Round: ${round}`,
      `\nFiles to grade:\n${currentFiles.map((f) => `--- ${f.path} ---\n${f.content}`).join("\n\n")}`,
      `\nRespond ONLY with JSON: {"score": <0-100>, "critique": "<specific, actionable feedback>"}`,
    ].join("\n");

    log(run, `Round ${round}: calling Judge (${run.judgeProfileId})...`);
    let judgeResult;
    try {
      judgeResult = await callModel(run.judgeProfileId, {
        system: judgePromptTemplate,
        messages: [{ role: "user", content: judgeUserMessage }],
      });
    } catch (err) {
      log(run, `Judge call failed: ${err.message}`);
      run.status = "error";
      emit(run.id, "status", { status: "error" });
      return;
    }

    await recordUsage(judgeResult.profileId, judgeResult.usage);
    if (judgeResult.usedFallback) {
      log(run, `Judge fell back to "${judgeResult.profileId}".`);
    }
    const verdict = parseJudgeVerdict(judgeResult.text);
    run.bestScore = Math.max(run.bestScore, verdict.score);
    run.rounds.push({
      round,
      builderProfileId: builderResult.profileId,
      judgeProfileId: judgeResult.profileId,
      score: verdict.score,
      critique: verdict.critique,
      files: written,
    });
    log(run, `Round ${round} score: ${verdict.score}/100. Critique: ${verdict.critique}`);
    emit(run.id, "round", run.rounds[run.rounds.length - 1]);

    if (verdict.score >= run.passThreshold) {
      run.status = "awaiting_approval";
      log(run, `PASSED at ${verdict.score}/100 (threshold ${run.passThreshold}). Awaiting human approval before publish.`);
      emit(run.id, "status", { status: "awaiting_approval" });
      await appendRunSummary(run);
      return;
    }

    critique = verdict.critique;
  }

  run.status = "needs_human";
  log(run, `Reached max rounds (${run.maxRounds}) without passing threshold ${run.passThreshold}. Escalating to a human.`);
  emit(run.id, "status", { status: "needs_human" });
  await appendRunSummary(run);
}

export async function approveRun(runId) {
  const run = runs.get(runId);
  if (!run) throw new Error(`Unknown run: ${runId}`);
  if (run.status !== "awaiting_approval") {
    throw new Error(`Run is not awaiting approval (status: ${run.status})`);
  }
  const destDir = path.join(config.publishedPath, runId);
  await fs.mkdir(destDir, { recursive: true });
  const files = await readCurrentFiles(run.sandboxDir);
  for (const file of files) {
    const target = path.join(destDir, file.path);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.content, "utf-8");
  }
  run.status = "published";
  log(run, `Human approved. Published ${files.length} file(s) to ${destDir}.`);
  emit(run.id, "status", { status: "published" });
  return run;
}

export async function rejectRun(runId, reason) {
  const run = runs.get(runId);
  if (!run) throw new Error(`Unknown run: ${runId}`);
  run.status = "rejected";
  log(run, `Human rejected the run${reason ? `: ${reason}` : "."}`);
  emit(run.id, "status", { status: "rejected" });
  return run;
}
