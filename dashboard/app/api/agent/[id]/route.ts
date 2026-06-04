import { AGENTS } from "@/lib/agents";

export const dynamic = "force-dynamic";

function openclawGatewayBase() {
  const port = process.env.OPENCLAW_GATEWAY_PORT ?? "18789";
  return `http://127.0.0.1:${port}`;
}

async function streamOpenClaw(
  messages: { role: string; content: string }[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const send = (data: object) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  const token = process.env.OPENCLAW_GATEWAY_TOKEN;
  const base = openclawGatewayBase();

  let res: Response;
  try {
    res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        model: "openclaw:main",
        messages,
        stream: true,
      }),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    send({ type: "error", text: `Could not reach OpenClaw gateway at ${base}: ${msg}\n\nMake sure the OpenClaw daemon is running (\`openclaw status\`) and that \`chatCompletions\` is enabled in \`~/.openclaw/openclaw.json\`.` });
    send({ type: "done" });
    controller.close();
    return;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    send({ type: "error", text: `OpenClaw gateway returned ${res.status}: ${body}` });
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

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta;
        if (delta?.content) {
          send({ type: "text", text: delta.content });
        }
      } catch {
        // malformed SSE line — skip
      }
    }
  }

  send({ type: "done" });
  controller.close();
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = AGENTS.find((a) => a.id === id);

  if (!agent) {
    return new Response(JSON.stringify({ error: "Unknown agent" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { prompt, history } = await req.json();

  // Build messages array from history + current prompt
  const messages: { role: string; content: string }[] = [
    ...(Array.isArray(history) ? history : []),
    { role: "user", content: prompt },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      if (agent.type === "openclaw") {
        streamOpenClaw(messages, controller, encoder).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          send({ type: "error", text: `OpenClaw error: ${msg}` });
          send({ type: "done" });
          controller.close();
        });
        return;
      }

      // Generic agent: requires envKey URL
      const endpointUrl = agent.envKey ? process.env[agent.envKey] : null;

      if (!endpointUrl) {
        const lines = [
          `**${agent.name}** is not connected yet.`,
          ``,
          `Add this to your \`.env.local\`:`,
          ``,
          `\`\`\``,
          `${agent.envKey ?? agent.id.toUpperCase() + "_URL"}=http://localhost:PORT`,
          `\`\`\``,
          ``,
          `The endpoint must accept \`POST /chat\` with \`{ "prompt": "..." }\`.`,
        ];
        for (const line of lines) {
          send({ type: "text", text: line + "\n" });
        }
        send({ type: "done" });
        controller.close();
        return;
      }

      fetch(`${endpointUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
        .then(async (res) => {
          const contentType = res.headers.get("content-type") ?? "";
          if (contentType.includes("text/event-stream")) {
            const reader = res.body!.getReader();
            const dec = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(encoder.encode(dec.decode(value)));
            }
          } else {
            const body = await res.json();
            const text = body.text ?? body.content ?? body.message ?? JSON.stringify(body);
            send({ type: "text", text });
          }
          send({ type: "done" });
          controller.close();
        })
        .catch((err: Error) => {
          send({ type: "error", text: `Could not reach ${agent.name}: ${err.message}` });
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
