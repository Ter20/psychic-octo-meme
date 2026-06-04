"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, RotateCcw, Copy, Wrench, ChevronDown, ArrowDown, Mic } from "lucide-react";
import { getAgent, type AgentConfig } from "@/lib/agents";
import AgentAvatar from "@/components/AgentAvatar";
import { useVoiceInput } from "@/hooks/useVoiceInput";

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgBlock =
  | { type: "text"; text: string }
  | { type: "tool"; name: string; input: unknown };

interface Message {
  id: string;
  role: "user" | "assistant";
  blocks: MsgBlock[];
  ts: Date;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const CLAUDE_PROMPTS = [
  "Explain a concept simply",
  "Help me debug some code",
  "Write a bash script for…",
  "Review my approach to…",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolBlock({ name, input }: { name: string; input: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="mt-2 rounded-lg overflow-hidden cursor-pointer"
      style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.18)" }}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs mono" style={{ color: "#a78bfa" }}>
        <Wrench size={11} />
        <span className="font-medium">{name}</span>
        <ChevronDown
          size={11}
          style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        />
      </div>
      {open && (
        <div
          className="px-3 pb-2 text-[11px] mono"
          style={{ borderTop: "1px solid rgba(167,139,250,0.12)", color: "var(--text-3)", paddingTop: 8 }}
        >
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(input, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function MarkdownText({ text }: { text: string }) {
  // Very lightweight inline markdown: bold, code spans, code blocks
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div
          key={key++}
          className="my-2 rounded-lg overflow-hidden"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {lang && (
            <div
              className="px-3 py-1 text-[10px] mono"
              style={{ color: "var(--text-3)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
            >
              {lang}
            </div>
          )}
          <pre
            className="px-3 py-2.5 text-[12px] mono overflow-x-auto"
            style={{ color: "#e2e8f0", lineHeight: 1.6 }}
          >
            {codeLines.join("\n")}
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizes = ["text-base font-bold", "text-sm font-semibold", "text-sm font-medium"];
      elements.push(
        <p key={key++} className={`${sizes[level - 1]} mt-3 mb-1`} style={{ color: "var(--text-1)" }}>
          {headingMatch[2]}
        </p>
      );
      i++;
      continue;
    }

    // Normal line (with inline bold / code)
    if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(
        <p key={key++} className="leading-relaxed">
          {parseInline(line, key)}
        </p>
      );
    }
    i++;
  }

  return <>{elements}</>;
}

function parseInline(text: string, baseKey: number): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${baseKey}-${i}`}
          className="mono text-[12px] px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.35)", color: "#c084fc", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${baseKey}-${i}`} style={{ color: "var(--text-1)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={`${baseKey}-${i}`}>{part}</span>;
  });
}

function UserBubble({ msg, agentColor }: { msg: Message; agentColor: string }) {
  const text = msg.blocks.filter((b): b is { type: "text"; text: string } => b.type === "text").map((b) => b.text).join("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex justify-end gap-2.5 msg-in"
    >
      <div className="flex flex-col items-end gap-1 max-w-[72%]">
        <div
          className="px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed text-white"
          style={{
            background: `linear-gradient(145deg, ${agentColor}cc, ${agentColor}99)`,
            boxShadow: `0 2px 16px ${agentColor}28`,
          }}
        >
          {text}
        </div>
        <span className="text-[10px] mono" style={{ color: "var(--text-3)" }}>
          {msg.ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      </div>
    </motion.div>
  );
}

function AssistantBubble({ msg, agent, showAvatar }: { msg: Message; agent: AgentConfig; showAvatar: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2.5 msg-in"
    >
      <div style={{ width: 28, flexShrink: 0 }}>
        {showAvatar && <AgentAvatar agent={agent} size={28} />}
      </div>
      <div className="flex flex-col gap-1 max-w-[75%]">
        <div
          className="px-4 py-3 rounded-2xl rounded-bl-md text-sm leading-relaxed"
          style={{
            background: "rgba(20,20,40,0.9)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "var(--text-2)",
          }}
        >
          {msg.blocks.map((block, i) => {
            if (block.type === "text") return <MarkdownText key={i} text={block.text} />;
            if (block.type === "tool") return <ToolBlock key={i} name={block.name} input={block.input} />;
            return null;
          })}
        </div>
        <span className="text-[10px] mono ml-1" style={{ color: "var(--text-3)" }}>
          {msg.ts.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </span>
      </div>
    </motion.div>
  );
}

function TypingIndicator({ agent }: { agent: AgentConfig }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.18 }}
      className="flex items-end gap-2.5"
    >
      <AgentAvatar agent={agent} size={28} />
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-md"
        style={{ background: "rgba(20,20,40,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot w-1.5 h-1.5 rounded-full"
            style={{ background: agent.color, animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function EmptyState({
  agent,
  onPrompt,
}: {
  agent: AgentConfig;
  onPrompt: (p: string) => void;
}) {
  const isClaude = agent.id === "claude";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full gap-6 px-6 text-center"
    >
      <div className="relative">
        <AgentAvatar agent={agent} size={72} />
        {isClaude && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{ background: `radial-gradient(circle, ${agent.color}30 0%, transparent 70%)` }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-1.5" style={{ color: "var(--text-1)" }}>
          {agent.name}
        </h2>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          {agent.tagline}
        </p>
      </div>

      {isClaude && (
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
          {CLAUDE_PROMPTS.map((p) => (
            <motion.button
              key={p}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onPrompt(p)}
              className="text-left text-xs px-3.5 py-2.5 rounded-xl transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "var(--text-2)",
              }}
            >
              {p}
            </motion.button>
          ))}
        </div>
      )}

      {!isClaude && agent.envKey && (
        <div
          className="text-xs px-4 py-3 rounded-xl mono max-w-xs text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "var(--text-3)",
            lineHeight: 1.8,
          }}
        >
          Add <span style={{ color: agent.color }}>{agent.envKey}</span> to{" "}
          <span style={{ color: "var(--text-2)" }}>.env.local</span> to connect
        </div>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChatWindow({ agentId }: { agentId: string }) {
  const agent = getAgent(agentId);
  const fallbackAgent = {
    id: agentId,
    name: agentId,
    tagline: "",
    color: "#6b7280",
    gradientFrom: "#374151",
    gradientTo: "#1f2937",
    icon: "zap" as const,
    envKey: null,
  };
  const a: AgentConfig = agent ?? fallbackAgent;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeAssistantId = useRef<string | null>(null);

  // Reset state when agent changes
  useEffect(() => {
    setMessages([]);
    setInput("");
    setStreaming(false);
    setSessionId(null);
    activeAssistantId.current = null;
    inputRef.current?.focus();
  }, [agentId]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (atBottom) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  const send = useCallback(
    async (overridePrompt?: string) => {
      const prompt = (overridePrompt ?? input).trim();
      if (!prompt || streaming) return;

      setInput("");
      setStreaming(true);

      const userMsg: Message = { id: uid(), role: "user", blocks: [{ type: "text", text: prompt }], ts: new Date() };
      const aId = uid();
      activeAssistantId.current = aId;
      const assistantMsg: Message = { id: aId, role: "assistant", blocks: [], ts: new Date() };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const endpoint = a.id === "claude" ? "/api/claude" : `/api/agent/${a.id}`;
      const body = a.id === "claude" ? { prompt, sessionId } : { prompt };

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
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
            try {
              const ev = JSON.parse(line.slice(6));
              if (ev.type === "session") setSessionId(ev.sessionId);
              else if (ev.type === "done" && ev.sessionId) setSessionId(ev.sessionId);
              else if (ev.type === "text") {
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== aId) return m;
                    const last = m.blocks[m.blocks.length - 1];
                    if (last?.type === "text") {
                      return { ...m, blocks: [...m.blocks.slice(0, -1), { type: "text", text: last.text + ev.text }] };
                    }
                    return { ...m, blocks: [...m.blocks, { type: "text", text: ev.text }] };
                  })
                );
              } else if (ev.type === "tool") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aId ? { ...m, blocks: [...m.blocks, { type: "tool", name: ev.name, input: ev.input }] } : m
                  )
                );
              }
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aId
              ? { ...m, blocks: [{ type: "text", text: `Connection error: ${String(err)}` }] }
              : m
          )
        );
      } finally {
        setStreaming(false);
        activeAssistantId.current = null;
        inputRef.current?.focus();
      }
    },
    [input, streaming, sessionId, a]
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const resetSession = () => {
    setMessages([]);
    setSessionId(null);
    voiceStop();
    inputRef.current?.focus();
  };

  // Voice input — appends finalized speech to whatever is already typed
  const handleVoiceFinal = useCallback(
    (text: string) => {
      setInput((prev) => {
        const joined = prev.trimEnd();
        return joined ? `${joined} ${text}` : text;
      });
      // Auto-resize the textarea after appending
      requestAnimationFrame(() => {
        const t = inputRef.current;
        if (t) { t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; }
      });
    },
    []
  );

  const { status: voiceStatus, interim: voiceInterim, supported: voiceSupported, toggle: voiceToggle, stop: voiceStop } =
    useVoiceInput(handleVoiceFinal);

  const copyLast = () => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last) {
      const text = last.blocks
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join("");
      navigator.clipboard.writeText(text);
    }
  };

  // Group consecutive messages for avatar display
  const grouped = messages.map((msg, i) => ({
    ...msg,
    showAvatar: msg.role === "assistant" && (i === 0 || messages[i - 1].role !== "assistant"),
  }));

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{
          height: 60,
          borderBottom: "1px solid var(--border)",
          background: "rgba(12,12,24,0.7)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-3">
          <AgentAvatar agent={a} size={36} showStatus status={a.id === "claude" ? "online" : "unknown"} />
          <div>
            <h1 className="text-sm font-semibold leading-tight" style={{ color: "var(--text-1)" }}>
              {a.name}
            </h1>
            <p className="text-[11px] leading-tight mt-0.5" style={{ color: a.id === "claude" ? "#34d399" : "var(--text-3)" }}>
              {a.id === "claude"
                ? sessionId ? `Session ${sessionId.slice(0, 8)}…` : "Ready"
                : a.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <HeaderBtn icon={<Copy size={13} />} onClick={copyLast} title="Copy last reply" />
          <HeaderBtn icon={<RotateCcw size={13} />} onClick={resetSession} title="New session" />
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ padding: "24px 24px 8px" }}
      >
        {messages.length === 0 ? (
          <EmptyState agent={a} onPrompt={(p) => send(p)} />
        ) : (
          <div className="flex flex-col gap-3 max-w-3xl mx-auto">
            {grouped.map((msg) =>
              msg.role === "user" ? (
                <UserBubble key={msg.id} msg={msg} agentColor={a.color} />
              ) : (
                <AssistantBubble key={msg.id} msg={msg} agent={a} showAvatar={msg.showAvatar} />
              )
            )}
            <AnimatePresence>{streaming && <TypingIndicator agent={a} />}</AnimatePresence>
            <div style={{ height: 8 }} />
          </div>
        )}
      </div>

      {/* Scroll-to-bottom fab */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-8 flex items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              background: "rgba(20,20,40,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              position: "absolute",
            }}
          >
            <ArrowDown size={15} style={{ color: "var(--text-2)" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Input ── */}
      <div
        className="flex-shrink-0 px-5 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            animate={{
              boxShadow:
                voiceStatus === "listening"
                  ? `0 0 0 1px ${a.color}88, 0 4px 28px ${a.color}22`
                  : streaming
                  ? `0 0 0 1px ${a.color}55, 0 4px 24px ${a.color}18`
                  : "0 0 0 1px rgba(255,255,255,0.07)",
            }}
            transition={{ duration: 0.3 }}
            className="flex flex-col rounded-2xl px-4 pt-3 pb-2.5 gap-2"
            style={{ background: "var(--bg-input)" }}
          >
            {/* Interim voice-recognition preview */}
            <AnimatePresence>
              {voiceStatus === "listening" && voiceInterim && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2 text-xs overflow-hidden"
                  style={{ color: a.color }}
                >
                  <span className="flex gap-0.5 flex-shrink-0">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="typing-dot inline-block w-1 h-1 rounded-full"
                        style={{ background: a.color, animationDelay: `${i * 0.18}s` }}
                      />
                    ))}
                  </span>
                  <span className="italic opacity-80 truncate">{voiceInterim}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Textarea + buttons row */}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={
                  voiceStatus === "listening"
                    ? "Listening…"
                    : streaming
                    ? `${a.name} is thinking…`
                    : `Message ${a.name}…`
                }
                disabled={streaming}
                rows={1}
                className="flex-1 bg-transparent text-sm outline-none resize-none mono"
                style={{
                  color: "var(--text-1)",
                  lineHeight: "1.6",
                  maxHeight: 140,
                  caretColor: a.color,
                }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = `${t.scrollHeight}px`;
                }}
              />

              {/* Mic button */}
              {voiceSupported && (
                <MicButton
                  status={voiceStatus}
                  agentColor={a.color}
                  onClick={voiceToggle}
                />
              )}

              {/* Send button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all"
                style={{
                  width: 34,
                  height: 34,
                  background:
                    input.trim() && !streaming
                      ? `linear-gradient(145deg, ${a.color}, ${a.gradientTo})`
                      : "rgba(255,255,255,0.05)",
                  boxShadow: input.trim() && !streaming ? `0 2px 12px ${a.color}40` : "none",
                }}
              >
                <Send
                  size={14}
                  color={input.trim() && !streaming ? "white" : "var(--text-3)"}
                  style={{ transform: "translateX(1px)" }}
                />
              </motion.button>
            </div>
          </motion.div>

          <p className="text-center text-[10px] mt-2 mono" style={{ color: "var(--text-3)" }}>
            ⏎ send · ⇧⏎ newline{voiceSupported ? " · 🎤 voice" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function MicButton({
  status,
  agentColor,
  onClick,
}: {
  status: "idle" | "listening";
  agentColor: string;
  onClick: () => void;
}) {
  const isOn = status === "listening";
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={isOn ? "Stop recording (click or just stop speaking)" : "Voice input"}
      className="relative flex-shrink-0 flex items-center justify-center rounded-xl overflow-visible"
      style={{
        width: 34,
        height: 34,
        background: isOn ? `${agentColor}1a` : "rgba(255,255,255,0.05)",
        border: `1px solid ${isOn ? agentColor + "55" : "rgba(255,255,255,0.07)"}`,
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      {/* Expanding ring animation while recording */}
      {isOn && (
        <motion.span
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: `1px solid ${agentColor}` }}
          animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <Mic
        size={14}
        color={isOn ? agentColor : "var(--text-3)"}
        strokeWidth={isOn ? 2.5 : 1.8}
      />
    </motion.button>
  );
}

function HeaderBtn({
  icon,
  onClick,
  title,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      className="flex items-center justify-center rounded-lg transition-colors"
      style={{
        width: 30,
        height: 30,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        color: "var(--text-3)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
    >
      {icon}
    </motion.button>
  );
}
