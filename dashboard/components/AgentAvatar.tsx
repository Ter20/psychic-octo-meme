"use client";
import { Sparkles, Grip, Zap, Shield, Flame } from "lucide-react";
import type { AgentConfig } from "@/lib/agents";

const ICON_MAP = {
  sparkles: Sparkles,
  grip: Grip,
  zap: Zap,
  shield: Shield,
  flame: Flame,
} as const;

interface Props {
  agent: AgentConfig;
  size?: number;
  showStatus?: boolean;
  status?: "online" | "offline" | "unknown";
  className?: string;
}

export default function AgentAvatar({
  agent,
  size = 36,
  showStatus = false,
  status = "unknown",
  className = "",
}: Props) {
  const Icon = ICON_MAP[agent.icon];
  const radius = Math.round(size * 0.28);
  const iconSize = Math.floor(size * 0.44);
  const dotSize = Math.round(size * 0.3);

  const statusColor =
    status === "online" ? "#34d399" :
    status === "offline" ? "#f87171" :
    "#374151";

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          background: `linear-gradient(145deg, ${agent.gradientFrom}, ${agent.gradientTo})`,
          borderRadius: radius,
          boxShadow: `0 2px 12px ${agent.color}30, 0 0 0 1px ${agent.color}18`,
        }}
      >
        <Icon size={iconSize} color="white" strokeWidth={1.8} style={{ opacity: 0.92 }} />
      </div>

      {showStatus && (
        <span
          className="absolute"
          style={{
            bottom: -1,
            right: -1,
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            background: statusColor,
            border: `${Math.max(1, Math.floor(dotSize * 0.25))}px solid var(--bg-sidebar)`,
          }}
        />
      )}
    </div>
  );
}
