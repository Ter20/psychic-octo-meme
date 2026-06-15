import { AGENTS, AgentConfig } from "@/lib/agents";

export const dynamic = "force-dynamic";

// ── helpers ──────────────────────────────────────────────────────────────────

function openclawBase() {
  return `http://127.0.0.1:${process.env.OPENCLAW_GATEWAY_PORT ?? "18789"}`;
}

const OPENROUTER_MODELS: Record<string, string> = {
  hermes: "nousresearch/hermes-3-llama-3.1-405b",
};

const OPENAI_MODELS: Record<string, string> = {
  sentinel: "gpt-4o",
  forge: "o3-mini",
};

// ── shared OpenAI-compatible SSE parser ──────────────────────────────────────

async function streamOpenAICompat(
  url: string,
  headers: Record<string, string>,
  body: object,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  label: string
) {
  const send = (data: object) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    send({ type: "error", text: `Could not reach ${label}: ${msg}` });
    send({ type: "done" });
    controller.close();
    return;
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    send({ type: "error", text: `${label} returned ${res.status}: ${errBody}` });
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
        const content = json?.choices?.[0]?.delta?.content;
        if (content) send({ type: "text", text: content });
      } catch {
        // malformed chunk — skip
      }
    }
  }

  send({ type: "done" });
  controller.close();
}

// ── per-type streaming functions ─────────────────────────────────────────────

function streamOpenClaw(messages: { role: string; content: string }[], ctrl: ReadableStreamDefaultController, enc: TextEncoder) {
  const token = process.env.OPENCLAW_GATEWAY_TOKEN;
  return streamOpenAICompat(
    `${openclawBase()}/v1/chat/completions`,
    token ? { Authorization: `Bearer ${token}` } : {},
    { model: "openclaw:main", messages, stream: true },
    ctrl, enc, "OpenClaw"
  );
}

function streamOpenRouter(agentId: string, messages: { role: string; content: string }[], ctrl: ReadableStreamDefaultController, enc: TextEncoder) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    const send = (d: object) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(d)}\n\n`));
    send({ type: "error", text: "OPENROUTER_API_KEY is not set in .env.local" });
    send({ type: "done" });
    ctrl.close();
    return Promise.resolve();
  }
  const model = OPENROUTER_MODELS[agentId] ?? "nousresearch/hermes-3-llama-3.1-405b";
  return streamOpenAICompat(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Mission Control",
    },
    { model, messages, stream: true },
    ctrl, enc, `Hermes (OpenRouter/${model})`
  );
}

function streamOpenAI(agentId: string, messages: { role: string; content: string }[], ctrl: ReadableStreamDefaultController, enc: TextEncoder) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    const send = (d: object) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(d)}\n\n`));
    send({ type: "error", text: "OPENAI_API_KEY is not set in .env.local" });
    send({ type: "done" });
    ctrl.close();
    return Promise.resolve();
  }
  const model = OPENAI_MODELS[agentId] ?? "gpt-4o";
  return streamOpenAICompat(
    "https://api.openai.com/v1/chat/completions",
    { Authorization: `Bearer ${key}` },
    { model, messages, stream: true },
    ctrl, enc, `${agentId} (OpenAI/${model})`
  );
}

// ── route ────────────────────────────────────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent: AgentConfig | undefined = AGENTS.find((a) => a.id === id);

  if (!agent) {
    return new Response(JSON.stringify({ error: "Unknown agent" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { prompt, history } = await req.json();

  const messages: { role: string; content: string }[] = [
    ...(Array.isArray(history) ? history : []),
    { role: "user", content: prompt },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const wrap = (p: Promise<void>) =>
        p.catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          send({ type: "error", text: `${agent.name} error: ${msg}` });
          send({ type: "done" });
          controller.close();
        });

      if (agent.type === "openclaw") {
        wrap(streamOpenClaw(messages, controller, encoder));
      } else if (agent.type === "openrouter") {
        wrap(streamOpenRouter(agent.id, messages, controller, encoder));
      } else if (agent.type === "openai") {
        wrap(streamOpenAI(agent.id, messages, controller, encoder));
      } else {
        // Generic fallback
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
          ];
          for (const line of lines) send({ type: "text", text: line + "\n" });
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
            const ct = res.headers.get("content-type") ?? "";
            if (ct.includes("text/event-stream")) {
              const reader = res.body!.getReader();
              const dec = new TextDecoder();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                controller.enqueue(encoder.encode(dec.decode(value)));
              }
            } else {
              const body = await res.json();
              send({ type: "text", text: body.text ?? body.content ?? body.message ?? JSON.stringify(body) });
            }
            send({ type: "done" });
            controller.close();
          })
          .catch((err: Error) => {
            send({ type: "error", text: `Could not reach ${agent.name}: ${err.message}` });
            send({ type: "done" });
            controller.close();
          });
      }
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
