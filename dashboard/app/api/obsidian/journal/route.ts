import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const VAULT = process.env.OBSIDIAN_VAULT ?? "/Users/tappl/ameDocuments/ObsidianVault";
const FOLDER = "Agentic OS";
const SUBFOLDER = "Journal";

function longDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function buildFile(dateStr: string, body: string): string {
  return [
    "---",
    `date: ${dateStr}`,
    "tags: [agentic-os, journal]",
    "---",
    "",
    `# 📓 ${longDate(dateStr)}`,
    "",
    body.trimEnd(),
    "",
  ].join("\n");
}

function extractBody(raw: string): string {
  const lines = raw.split("\n");
  let dashes = 0;
  let pastFrontmatter = false;
  let h1Skipped = false;
  const body: string[] = [];

  for (const line of lines) {
    if (!pastFrontmatter) {
      if (line === "---" && ++dashes === 2) pastFrontmatter = true;
      continue;
    }
    if (!h1Skipped && line.startsWith("# ")) { h1Skipped = true; continue; }
    body.push(line);
  }

  while (body.length && body[0].trim() === "") body.shift();
  return body.join("\n");
}

export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  try {
    const raw = await readFile(join(VAULT, FOLDER, SUBFOLDER, `${date}.md`), "utf-8");
    return Response.json({ content: extractBody(raw), date });
  } catch {
    return Response.json({ content: "", date });
  }
}

export async function PUT(req: Request) {
  const { date, content } = (await req.json()) as { date: string; content: string };
  const folderPath = join(VAULT, FOLDER, SUBFOLDER);
  try {
    await mkdir(folderPath, { recursive: true });
    await writeFile(join(folderPath, `${date}.md`), buildFile(date, content), "utf-8");
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
