import { spawn } from "child_process";

export const dynamic = "force-dynamic";

const IS_WIN = process.platform === "win32";

function findClaude(): Promise<string> {
  return new Promise((resolve) => {
    // "where" on Windows, "which" on Mac/Linux
    const finder = spawn(IS_WIN ? "where" : "which", ["claude"], { shell: IS_WIN });
    let out = "";
    finder.stdout.on("data", (d: Buffer) => { out += d.toString(); });
    finder.on("close", (code: number) => {
      // "where" can return multiple lines; take the first non-empty one
      const path = out.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
      resolve(code === 0 && path ? path : "");
    });
    finder.on("error", () => resolve(""));
  });
}

export async function POST(req: Request) {
  const { prompt, sessionId } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      findClaude().then((claudePath) => {
        if (!claudePath) {
          send({ type: "text", text: "⚠️ Claude CLI not found in PATH. To connect:\n\n```\nnpm install -g @anthropic-ai/claude-code\nclaude auth\n```\n\nOnce installed, restart the dev server." });
          send({ type: "done" });
          controller.close();
          return;
        }

        const args = ["--print", "--output-format", "stream-json"];
        if (sessionId) args.push("--resume", sessionId);
        args.push("--", prompt);

        const proc = spawn(claudePath, args, {
          env: { ...process.env },
          shell: IS_WIN, // needed on Windows so .cmd wrappers execute
          stdio: ["ignore", "pipe", "pipe"],
        });

        let buf = "";

        proc.stdout.on("data", (chunk: Buffer) => {
          buf += chunk.toString();
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.type === "assistant" && parsed.message?.content) {
                for (const block of parsed.message.content) {
                  if (block.type === "text") {
                    send({ type: "text", text: block.text });
                  } else if (block.type === "tool_use") {
                    send({ type: "tool", name: block.name, input: block.input });
                  }
                }
              } else if (parsed.type === "result") {
                send({ type: "done", sessionId: parsed.session_id });
              } else if (parsed.type === "system" && parsed.subtype === "init") {
                send({ type: "session", sessionId: parsed.session_id });
              }
            } catch {
              // Non-JSON output — emit as raw text
              if (trimmed) send({ type: "text", text: trimmed });
            }
          }
        });

        proc.stderr.on("data", (chunk: Buffer) => {
          const msg = chunk.toString().trim();
          if (msg) send({ type: "error", text: msg });
        });

        proc.on("close", () => {
          if (buf.trim()) {
            try {
              const parsed = JSON.parse(buf.trim());
              if (parsed.type === "result") send({ type: "done", sessionId: parsed.session_id });
            } catch {
              send({ type: "text", text: buf.trim() });
            }
          }
          send({ type: "done" });
          controller.close();
        });

        proc.on("error", (err: Error) => {
          send({ type: "error", text: err.message });
          send({ type: "done" });
          controller.close();
        });
      }).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        send({ type: "error", text: `Claude CLI error: ${msg}` });
        send({ type: "done" });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
