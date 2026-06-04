"use client";
import { motion } from "framer-motion";
import { Activity, Cpu, Wifi, Clock, Zap } from "lucide-react";
import { useEffect, useState } from "react";

function useTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function SystemHeader({ activeAgents }: { activeAgents: number }) {
  const time = useTime();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass border-b border-white/[0.06] px-6 py-3 flex items-center justify-between sticky top-0 z-50"
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: "conic-gradient(from 0deg, #8b5cf6, #3b82f6, #10b981, #8b5cf6)",
            padding: "2px",
          }}
        >
          <div className="w-full h-full rounded-full bg-[#020308] flex items-center justify-center">
            <Zap size={14} className="text-violet-400" />
          </div>
        </motion.div>
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase gradient-text">
            Mission Control
          </h1>
          <p className="text-[10px] text-slate-500 terminal-font tracking-wider">AI COMMAND CENTER v1.0</p>
        </div>
      </div>

      {/* Center: Status pills */}
      <div className="hidden md:flex items-center gap-3">
        <StatusPill icon={<Activity size={11} />} label="CLAUDE" status="online" color="#8b5cf6" />
        <StatusPill icon={<Cpu size={11} />} label={`${activeAgents} AGENTS`} status="active" color="#3b82f6" />
        <StatusPill icon={<Wifi size={11} />} label="BRIDGE" status="ready" color="#10b981" />
      </div>

      {/* Right: Clock */}
      <div className="flex items-center gap-2 text-slate-400">
        <Clock size={12} />
        <span className="terminal-font text-sm tracking-widest text-slate-300">{time}</span>
      </div>
    </motion.header>
  );
}

function StatusPill({
  icon,
  label,
  status,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium tracking-widest"
      style={{
        background: `${color}14`,
        border: `1px solid ${color}30`,
        color,
      }}
    >
      <div className="relative flex items-center justify-center">
        <span
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ background: color, animation: "pulse-ring 2s ease-out infinite" }}
        />
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      </div>
      {icon}
      {label}
      <span className="opacity-60 ml-0.5">{status.toUpperCase()}</span>
    </div>
  );
}
