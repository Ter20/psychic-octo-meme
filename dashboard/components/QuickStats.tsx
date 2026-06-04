"use client";
import { motion } from "framer-motion";
import { MessageSquare, Cpu, Layers, TrendingUp } from "lucide-react";

const STATS = [
  { label: "Messages", value: "—", icon: <MessageSquare size={16} />, color: "#8b5cf6", suffix: "" },
  { label: "Tokens Used", value: "—", icon: <Cpu size={16} />,         color: "#3b82f6", suffix: "" },
  { label: "Contexts",    value: "1",  icon: <Layers size={16} />,      color: "#10b981", suffix: " active" },
  { label: "Uptime",      value: "—",  icon: <TrendingUp size={16} />,  color: "#f97316", suffix: "" },
];

function useUptime() {
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

import React from "react";

export default function QuickStats() {
  const uptime = useUptime();
  const display = STATS.map((s, i) => ({ ...s, value: i === 3 ? uptime : s.value }));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {display.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: i * 0.07 }}
          className="glass-panel rounded-xl p-4"
          style={{ border: `1px solid ${stat.color}15` }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
            style={{ background: `${stat.color}18`, color: stat.color }}
          >
            {stat.icon}
          </div>
          <div
            className="text-xl font-bold terminal-font mb-0.5"
            style={{ color: stat.color }}
          >
            {stat.value}{stat.suffix}
          </div>
          <div className="text-[11px] text-slate-500 uppercase tracking-widest">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
