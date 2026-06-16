import { spawn } from "child_process";

export const dynamic = "force-dynamic";

const IS_WIN = process.platform === "win32";

function findClaude(): Promise<string> {
  return new Promise((resolve) => {
    const finder = spawn(IS_WIN ? "where" : "which", ["claude"], { shell: IS_WIN });
    let out = "";
    finder.stdout.on("data", (d: Buffer) => { out += d.toString(); });
    finder.on("close", (code: number) => {
      const path = out.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
      resolve(code === 0 && path ? path : "");
    });
    finder.on("error", () => resolve(""));
  });
}

async function streamAnthropicAPI(
  messages: { role: string; content: string }[],
  apiKey: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const send = (data: object) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 8096,
        stream: true,
      }),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    send({ type: "error", text: `Anthropic API error: ${msg}` });
    send({ type: "done" });
    controller.close();
    return;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    send({ type: "error", text: `Anthropic API returned ${res.status}: ${body}` });
    send({ type: "done" });
    controller.close();
    return;
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });

    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    let eventType = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        const payload = line.slice(6).trim();
        if (payload === "[DONE]" || eventType === "message_stop") continue;
        try {
          const json = JSON.parse(payload);
          if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
            send({ type: "text", text: json.delta.text });
          }
        } catch {
          // skip malformed
        }
      }
    }
  }

  send({ type: "done" });
  controller.close();
}

export async function POST(req: Request) {
  const { prompt, sessionId, history } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build message history for Anthropic API
  const messages: { role: string; content: string }[] = [
    ...(Array.isArray(history) ? history : []),
    { role: "user", content: prompt },
  ];

  const encoder = new TextEncoder();
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      // Prefer direct Anthropic API if key is set
      if (anthropicKey) {
        streamAnthropicAPI(messages, anthropicKey, controller, encoder).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          send({ type: "error", text: `Claude API error: ${msg}` });
          send({ type: "done" });
          controller.close();
        });
        return;
      }

      // Fall back to Claude CLI
      findClaude().then((claudePath) => {
        if (!claudePath) {
          send({
            type: "text",
            text: "⚠️ Claude is not configured yet.\n\nTo fix this, go to **Settings** (bottom of sidebar) and enter your **Anthropic API key**.\n\nOr install the Claude CLI:\n```\nnpm install -g @anthropic-ai/claude-code\nclaude auth\n```",
          });
          send({ type: "done" });
          controller.close();
          return;
        }

        const args = ["--print", "--output-format", "stream-json", "--verbose"];
        if (sessionId) args.push("--resume", sessionId);
        args.push("--", prompt);

        const proc = spawn(claudePath, args, {
          env: { ...process.env },
          shell: IS_WIN,
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
                  if (block.type === "text") send({ type: "text", text: block.text });
                  else if (block.type === "tool_use") send({ type: "tool", name: block.name, input: block.input });
                }
              } else if (parsed.type === "result") {
                send({ type: "done", sessionId: parsed.session_id });
              } else if (parsed.type === "system" && parsed.subtype === "init") {
                send({ type: "session", sessionId: parsed.session_id });
              }
            } catch {
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
        send({ type: "error", text: `Claude error: ${msg}` });
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
