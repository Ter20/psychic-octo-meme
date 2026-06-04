import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const VAULT = process.env.OBSIDIAN_VAULT ?? "/Users/tappl/ameDocuments/ObsidianVault";
const FOLDER = "Agentic OS";
const FILE = "Goals.md";

interface Goal {
  id: string;
  text: string;
  done: boolean;
}

function parseGoals(content: string): Goal[] {
  return content
    .split("\n")
    .filter((line) => /^- \[[ xX]\] /.test(line))
    .map((line, i) => ({
      id: String(i),
      text: line.replace(/^- \[[ xX]\] /, "").trim(),
      done: /^- \[[xX]\]/.test(line),
    }));
}

function serializeGoals(goals: Goal[]): string {
  return [
    "---",
    "tags: [agentic-os, goals]",
    `updated: ${new Date().toISOString()}`,
    "---",
    "",
    "# 🎯 Goals",
    "",
    ...goals.map((g) => `- [${g.done ? "x" : " "}] ${g.text}`),
    "",
  ].join("\n");
}

export async function GET() {
  try {
    const content = await readFile(join(VAULT, FOLDER, FILE), "utf-8");
    return Response.json({ goals: parseGoals(content) });
  } catch {
    return Response.json({ goals: [] });
  }
}

export async function POST(req: Request) {
  const { goals } = (await req.json()) as { goals: Goal[] };
  const folderPath = join(VAULT, FOLDER);
  try {
    await mkdir(folderPath, { recursive: true });
    await writeFile(join(folderPath, FILE), serializeGoals(goals), "utf-8");
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
