import { AGENTS } from "@/lib/agents";

export const dynamic = "force-dynamic";

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

  const { prompt } = await req.json();
  const endpointUrl = agent.envKey ? process.env[agent.envKey] : null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      if (!endpointUrl) {
        // Not configured — send helpful setup instructions
        const lines = [
          `**${agent.name}** is not connected yet.`,
          ``,
          `To connect it, add this to your \`.env.local\`:`,
          ``,
          `\`\`\``,
          `${agent.envKey}=http://localhost:PORT`,
          `\`\`\``,
          ``,
          `The endpoint needs to accept \`POST /chat\` with \`{ "prompt": "..." }\` and return an SSE or JSON response.`,
        ];
        for (const line of lines) {
          send({ type: "text", text: line + (line === "" ? "" : "\n") });
        }
        send({ type: "done" });
        controller.close();
        return;
      }

      // Forward to agent endpoint
      fetch(`${endpointUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
        .then(async (res) => {
          const contentType = res.headers.get("content-type") ?? "";
          if (contentType.includes("text/event-stream")) {
            // Forward SSE stream
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
