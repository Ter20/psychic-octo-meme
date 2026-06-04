"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Terminal, Trash2, Copy, Sparkles, Wrench } from "lucide-react";

type Role = "user" | "assistant" | "system";
type MsgBlock = { type: "text"; text: string } | { type: "tool"; name: string; input: unknown };

interface Message {
  id: string;
  role: Role;
  blocks: MsgBlock[];
  timestamp: Date;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function ToolBlock({ name, input }: { name: string; input: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="mt-2 rounded-lg border border-violet-500/20 bg-violet-500/5 overflow-hidden cursor-pointer"
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center gap-2 px-3 py-2 text-violet-400 text-xs terminal-font">
        <Wrench size={11} />
        <span className="font-medium">{name}</span>
        <span className="ml-auto opacity-50">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="px-3 pb-2 text-[11px] terminal-font text-slate-400 border-t border-violet-500/10">
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(input, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  if (isSystem) {
    return (
      <div className="text-center text-xs text-slate-500 terminal-font py-1">
        {msg.blocks.map((b) => b.type === "text" && b.text).join("")}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 message-in ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
          style={{
            background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
            boxShadow: "0 0 12px rgba(139,92,246,0.5)",
          }}
        >
          <Sparkles size={12} className="text-white" />
        </div>
      )}

      <div className={`max-w-[82%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "text-white rounded-tr-sm"
              : "text-slate-200 rounded-tl-sm"
          }`}
          style={
            isUser
              ? {
                  background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
                  boxShadow: "0 4px 20px rgba(109,40,217,0.35)",
                }
              : {
                  background: "rgba(20,24,48,0.9)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }
          }
        >
          {msg.blocks.map((block, i) => {
            if (block.type === "text") {
              return (
                <div key={i} className="whitespace-pre-wrap break-words">
                  {block.text}
                </div>
              );
            }
            if (block.type === "tool") {
              return <ToolBlock key={i} name={block.name} input={block.input} />;
            }
            return null;
          })}
        </div>
        <span className="text-[10px] text-slate-600 terminal-font px-1">
          {msg.timestamp.toLocaleTimeString("en-US", { hour12: false })}
        </span>
      </div>

      {isUser && (
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1 text-xs font-bold text-white"
          style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          U
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex gap-3"
    >
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", boxShadow: "0 0 12px rgba(139,92,246,0.5)" }}
      >
        <Sparkles size={12} className="text-white" />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
        style={{ background: "rgba(20,24,48,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot w-1.5 h-1.5 rounded-full bg-violet-400"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function ClaudePanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "system",
      blocks: [{ type: "text", text: "— Session started —" }],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const send = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || streaming) return;

    setInput("");
    setStreaming(true);

    const userMsg: Message = {
      id: uid(),
      role: "user",
      blocks: [{ type: "text", text: prompt }],
      timestamp: new Date(),
    };

    const assistantId = uid();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      blocks: [],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, sessionId }),
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
            const event = JSON.parse(line.slice(6));

            if (event.type === "session") {
              setSessionId(event.sessionId);
            } else if (event.type === "done") {
              if (event.sessionId) setSessionId(event.sessionId);
            } else if (event.type === "text") {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  const last = m.blocks[m.blocks.length - 1];
                  if (last?.type === "text") {
                    return { ...m, blocks: [...m.blocks.slice(0, -1), { type: "text", text: last.text + event.text }] };
                  }
                  return { ...m, blocks: [...m.blocks, { type: "text", text: event.text }] };
                })
              );
            } else if (event.type === "tool") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, blocks: [...m.blocks, { type: "tool", name: event.name, input: event.input }] }
                    : m
                )
              );
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, blocks: [...m.blocks, { type: "text", text: `\n⚠️ ${event.text}` }] }
                    : m
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
          m.id === assistantId
            ? { ...m, blocks: [{ type: "text", text: `Connection error: ${String(err)}` }] }
            : m
        )
      );
    } finally {
      setStreaming(false);
      textareaRef.current?.focus();
    }
  }, [input, streaming, sessionId]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearSession = () => {
    setMessages([{
      id: uid(),
      role: "system",
      blocks: [{ type: "text", text: "— New session started —" }],
      timestamp: new Date(),
    }]);
    setSessionId(null);
  };

  const copyLast = () => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) {
      const text = lastAssistant.blocks.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("");
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-panel rounded-2xl flex flex-col overflow-hidden glow-purple"
      style={{ height: "100%" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]"
        style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.1) 0%, transparent 100%)" }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: streaming ? 360 : 0 }}
            transition={{ duration: 2, repeat: streaming ? Infinity : 0, ease: "linear" }}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
          >
            <Sparkles size={14} className="text-white" />
          </motion.div>
          <div>
            <div className="text-sm font-semibold text-white">Claude</div>
            <div className="text-[10px] terminal-font" style={{ color: streaming ? "#34d399" : "#6b7280" }}>
              {streaming ? "● STREAMING" : sessionId ? `● SESSION ${sessionId.slice(0, 8)}…` : "● READY"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionBtn icon={<Copy size={12} />} onClick={copyLast} title="Copy last reply" />
          <ActionBtn icon={<Trash2 size={12} />} onClick={clearSession} title="New session" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 min-h-0">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        <AnimatePresence>{streaming && <TypingIndicator />}</AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/[0.06]">
        <div
          className="flex items-end gap-2 rounded-xl px-4 py-3 transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${streaming ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          <Terminal size={14} className="text-slate-500 flex-shrink-0 mb-1" />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Send a message to Claude… (⏎ to send, ⇧⏎ newline)"
            disabled={streaming}
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none outline-none terminal-font"
            style={{ maxHeight: 120, lineHeight: "1.5" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${t.scrollHeight}px`;
            }}
          />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={send}
            disabled={!input.trim() || streaming}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background:
                !input.trim() || streaming
                  ? "rgba(255,255,255,0.05)"
                  : "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              boxShadow:
                input.trim() && !streaming
                  ? "0 0 16px rgba(139,92,246,0.5)"
                  : "none",
            }}
          >
            <Send size={13} className={!input.trim() || streaming ? "text-slate-600" : "text-white"} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {icon}
    </motion.button>
  );
}
