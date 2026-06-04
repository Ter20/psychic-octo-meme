"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Wifi, WifiOff, HelpCircle, Send, Zap, RefreshCw } from "lucide-react";

type AgentStatus = "online" | "offline" | "unknown";
type Agent = {
  id: string;
  name: string;
  description: string;
  color: string;
  status: AgentStatus;
  lastSeen: string | null;
};

const COLOR_MAP: Record<string, { hex: string; glow: string }> = {
  orange: { hex: "#f97316", glow: "rgba(249,115,22,0.3)" },
  blue:   { hex: "#3b82f6", glow: "rgba(59,130,246,0.3)" },
  green:  { hex: "#10b981", glow: "rgba(16,185,129,0.3)" },
  purple: { hex: "#8b5cf6", glow: "rgba(139,92,246,0.3)" },
};

function StatusDot({ status, color }: { status: AgentStatus; color: string }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;
  const map: Record<AgentStatus, string> = {
    online: c.hex,
    offline: "#ef4444",
    unknown: "#6b7280",
  };
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      {status === "online" && (
        <span
          className="absolute w-3 h-3 rounded-full"
          style={{ background: map[status], animation: "pulse-ring 2s ease-out infinite" }}
        />
      )}
      <span className="w-2 h-2 rounded-full" style={{ background: map[status] }} />
    </div>
  );
}

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [cmdInput, setCmdInput] = useState("");
  const [log, setLog] = useState<string[]>(["Agent terminal ready…"]);
  const c = COLOR_MAP[agent.color] ?? COLOR_MAP.blue;

  const statusIcon =
    agent.status === "online" ? <Wifi size={12} /> :
    agent.status === "offline" ? <WifiOff size={12} /> :
    <HelpCircle size={12} />;

  const statusLabel =
    agent.status === "online" ? "ONLINE" :
    agent.status === "offline" ? "OFFLINE" : "UNKNOWN";

  const sendCmd = () => {
    if (!cmdInput.trim()) return;
    setLog((l) => [...l, `> ${cmdInput}`, `[${agent.name}] No endpoint configured — set ${agent.id.toUpperCase()}_URL in .env.local`]);
    setCmdInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="glass-panel rounded-xl overflow-hidden cursor-pointer select-none"
      style={{ border: `1px solid ${c.hex}18` }}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Card header */}
      <div
        className="p-4 flex items-center gap-3"
        style={{
          background: `linear-gradient(135deg, ${c.hex}0d 0%, transparent 60%)`,
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${c.hex}18`,
            border: `1px solid ${c.hex}30`,
            boxShadow: `0 0 12px ${c.glow}`,
          }}
        >
          <Bot size={16} style={{ color: c.hex }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{agent.name}</span>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium tracking-widest terminal-font"
              style={{ background: `${c.hex}15`, border: `1px solid ${c.hex}25`, color: c.hex }}
            >
              <StatusDot status={agent.status} color={agent.color} />
              {statusIcon}
              {statusLabel}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{agent.description}</p>
        </div>

        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-slate-600 text-xs ml-1"
        >▼</motion.span>
      </div>

      {/* Expandable terminal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="border-t border-white/[0.05] p-3 terminal-font"
              style={{ background: "rgba(0,0,0,0.3)" }}
            >
              <div className="h-24 overflow-y-auto text-[11px] text-slate-400 space-y-0.5 mb-2">
                {log.map((line, i) => (
                  <div key={i} className={line.startsWith(">") ? "text-slate-300" : "text-slate-500"}>
                    {line}
                  </div>
                ))}
              </div>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span style={{ color: c.hex }} className="text-xs">$</span>
                <input
                  value={cmdInput}
                  onChange={(e) => setCmdInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendCmd()}
                  placeholder={`Command for ${agent.name}…`}
                  className="flex-1 bg-transparent text-xs text-slate-300 outline-none placeholder-slate-600"
                />
                <button
                  onClick={sendCmd}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Send size={11} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AgentGrid() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents);
      setLastUpdate(new Date(data.timestamp).toLocaleTimeString("en-US", { hour12: false }));
    } catch {
      // Keep previous state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    const id = setInterval(fetchAgents, 15000);
    return () => clearInterval(id);
  }, []);

  const onlineCount = agents.filter((a) => a.status === "online").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-blue-400" />
          <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
            AI Agents
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] terminal-font"
            style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa" }}
          >
            {onlineCount}/{agents.length} online
          </span>
        </div>
        <button
          onClick={fetchAgents}
          className="flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-slate-400 transition-colors terminal-font"
        >
          <RefreshCw size={10} />
          {lastUpdate}
        </button>
      </motion.div>

      {/* Cards */}
      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-panel rounded-xl h-16 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {agents.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
