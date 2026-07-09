import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

const WIKILINK_RE = /\[\[([^\]|#]+)(?:[^\]]*)\]\]/g;

async function walk(dir, base = dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full, base)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

// Re-scans the vault directory on demand rather than holding an fs.watch
// handle - simpler and more portable across platforms/containers, and the
// vault is small enough (plain markdown) that a full scan is cheap.
export async function listNotes() {
  const files = await walk(config.vaultPath);
  return files.sort();
}

export async function readNote(relPath) {
  const target = path.resolve(config.vaultPath, relPath);
  if (!target.startsWith(path.resolve(config.vaultPath) + path.sep)) {
    throw new Error("Path escapes vault");
  }
  return fs.readFile(target, "utf-8");
}

export async function writeNote(relPath, content) {
  const target = path.resolve(config.vaultPath, relPath);
  if (!target.startsWith(path.resolve(config.vaultPath) + path.sep)) {
    throw new Error("Path escapes vault");
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, "utf-8");
}

export async function searchNotes(query) {
  if (!query || !query.trim()) return [];
  const needle = query.toLowerCase();
  const files = await listNotes();
  const results = [];
  for (const file of files) {
    const content = await readNote(file).catch(() => "");
    if (content.toLowerCase().includes(needle)) {
      const idx = content.toLowerCase().indexOf(needle);
      const snippet = content.slice(Math.max(0, idx - 60), idx + 120).replace(/\n/g, " ");
      results.push({ file, snippet });
    }
  }
  return results;
}

// Builds a lightweight graph (nodes + edges from [[wikilinks]]) for the
// "Memory Galaxy" visualization - no physics engine dependency, the frontend
// lays it out with a simple circular layout.
export async function buildMemoryGraph() {
  const files = await listNotes();
  const nodes = files.map((f) => ({ id: f, label: path.basename(f, ".md") }));
  const nodeIds = new Set(files);
  const edges = [];
  for (const file of files) {
    const content = await readNote(file).catch(() => "");
    let match;
    WIKILINK_RE.lastIndex = 0;
    while ((match = WIKILINK_RE.exec(content)) !== null) {
      const target = match[1].trim();
      const targetFile = files.find((f) => path.basename(f, ".md") === target) || `${target}.md`;
      if (nodeIds.has(targetFile)) {
        edges.push({ source: file, target: targetFile });
      }
    }
  }
  return { nodes, edges };
}

export async function appendJournal(entry) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const relPath = path.join("journal", `${dateStr}.md`);
  const target = path.resolve(config.vaultPath, relPath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  const timestamp = new Date().toISOString().slice(11, 16);
  await fs.appendFile(target, `\n### ${timestamp}\n${entry}\n`, "utf-8");
  return relPath;
}

export async function readJournal(dateStr) {
  const day = dateStr || new Date().toISOString().slice(0, 10);
  const relPath = path.join("journal", `${day}.md`);
  return readNote(relPath).catch(() => "");
}

// Called by the loop engine once a run passes the Judge - logs the outcome
// back into the vault so the system's memory grows with every finished task.
export async function appendRunSummary(run) {
  const relPath = path.join("PARA", "Archives", `run-${run.id}.md`);
  const lines = [
    `# Run ${run.id}`,
    "",
    `- Goal: ${run.goal}`,
    `- Definition of done: ${run.definitionOfDone}`,
    `- Status: ${run.status}`,
    `- Rounds: ${run.rounds.length}`,
    `- Best score: ${run.bestScore}`,
    "",
    "## Round history",
    ...run.rounds.map(
      (r) => `- Round ${r.round}: score ${r.score}/100 - ${r.critique}`
    ),
  ];
  await writeNote(relPath, lines.join("\n"));
  return relPath;
}
