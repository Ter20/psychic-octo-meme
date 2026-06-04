import { spawn } from "child_process";

export const dynamic = "force-dynamic";

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

      // Check if claude CLI is available
      const which = spawn("which", ["claude"]);
      let claudePath = "";

      which.stdout.on("data", (d: Buffer) => { claudePath += d.toString().trim(); });

      which.on("close", (code: number) => {
        if (code !== 0 || !claudePath) {
          // Fallback: simulate a helpful message when CLI isn't available
          send({ type: "text", text: "⚠️ Claude CLI not found in PATH. To connect:\n\n```bash\nnpm install -g @anthropic-ai/claude-code\nclaude auth\n```\n\nOnce installed, restart the dev server and your prompts will stream directly through the CLI." });
          send({ type: "done" });
          controller.close();
          return;
        }

        const args = ["--print", "--output-format", "stream-json"];
        if (sessionId) args.push("--resume", sessionId);
        args.push("--", prompt);

        const proc = spawn(claudePath, args, {
          env: { ...process.env },
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
