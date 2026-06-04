import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const VAULT = process.env.OBSIDIAN_VAULT ?? "/Users/tappl/ameDocuments/ObsidianVault";
const FOLDER = "Agentic OS";

// ─── Markdown helpers ─────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function initFile(dateStr: string, d: Date): string {
  return [
    "---",
    `date: ${dateStr}`,
    `created: ${d.toISOString()}`,
    "tags: [agentic-os]",
    "---",
    "",
    `# 🧠 Agentic OS — ${formatDate(d)}`,
    "",
    "## 🤖 Chats",
    "",
    "## 📓 Journal",
    "",
    "## 🎯 Goals",
    "",
  ].join("\n");
}

function chatEntry(time: string, agentName: string, user: string, assistant: string): string {
  // Indent assistant text so it looks clean inside the block
  const indented = assistant.split("\n").join("\n> ");
  return [
    `### 🗨 ${time} · ${agentName}`,
    "",
    `**You:** ${user}`,
    "",
    `> ${indented}`,
    "",
    "---",
    "",
  ].join("\n");
}

function journalEntry(time: string, text: string): string {
  return [`### 📝 ${time}`, "", text.trim(), "", "---", ""].join("\n");
}

function goalEntry(time: string, text: string): string {
  return [`- [ ] ${text.trim()} *(${time})*`].join("\n") + "\n";
}

// Insert `entry` immediately before the next `##` section after `sectionHeader`,
// or at the end of the file if it's the last section.
function insertIntoSection(doc: string, sectionHeader: string, entry: string): string {
  const headerIndex = doc.indexOf(`\n${sectionHeader}`);

  if (headerIndex === -1) {
    // Section missing — append it
    return doc.trimEnd() + `\n\n${sectionHeader}\n\n${entry}`;
  }

  // Find the start of the *next* ## after this section
  const searchFrom = headerIndex + sectionHeader.length + 1;
  const nextSectionMatch = doc.slice(searchFrom).match(/\n## /);

  if (nextSectionMatch && nextSectionMatch.index !== undefined) {
    const insertAt = searchFrom + nextSectionMatch.index;
    return doc.slice(0, insertAt) + "\n" + entry + doc.slice(insertAt);
  }

  // Last section — append at end
  return doc.trimEnd() + "\n\n" + entry;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, agentName = "Agent", content, timestamp } = body as {
      type: "chat" | "journal" | "goal";
      agentName?: string;
      content: { user?: string; assistant?: string; text?: string };
      timestamp: string;
    };

    const d = new Date(timestamp);
    const dateStr = d.toISOString().slice(0, 10);
    const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    const folderPath = join(VAULT, FOLDER);
    const filePath = join(folderPath, `${dateStr}.md`);

    // Ensure the Agentic OS folder exists
    await mkdir(folderPath, { recursive: true });

    // Read or create the daily file
    let doc: string;
    try {
      doc = await readFile(filePath, "utf-8");
    } catch {
      doc = initFile(dateStr, d);
    }

    // Build and insert the entry
    let entry: string;
    let section: string;

    if (type === "chat") {
      entry = chatEntry(timeStr, agentName, content.user ?? "", content.assistant ?? "");
      section = "## 🤖 Chats";
    } else if (type === "journal") {
      entry = journalEntry(timeStr, content.text ?? "");
      section = "## 📓 Journal";
    } else {
      entry = goalEntry(timeStr, content.text ?? "");
      section = "## 🎯 Goals";
    }

    const updated = insertIntoSection(doc, section, entry);
    await writeFile(filePath, updated, "utf-8");

    return Response.json({ ok: true, path: filePath });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
