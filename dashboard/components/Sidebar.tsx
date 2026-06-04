"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AGENTS } from "@/lib/agents";
import AgentAvatar from "@/components/AgentAvatar";
import { Settings, ChevronRight, Zap, BookOpen, Target } from "lucide-react";
import { useState } from "react";

const WORKSPACE_ITEMS = [
  {
    href: "/journal",
    label: "Journal",
    sub: "Daily notes",
    color: "#10b981",
    gradientFrom: "#059669",
    gradientTo: "#047857",
    Icon: BookOpen,
  },
  {
    href: "/goals",
    label: "Goals",
    sub: "Checkbox tasks",
    color: "#8b5cf6",
    gradientFrom: "#7c3aed",
    gradientTo: "#4f46e5",
    Icon: Target,
  },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col h-full flex-shrink-0 overflow-hidden"
      style={{
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{
          height: 60,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCollapsed((c) => !c)}
          className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{
            width: 32,
            height: 32,
            background: "linear-gradient(145deg, #7c3aed, #4338ca)",
            boxShadow: "0 2px 12px rgba(124,58,237,0.4)",
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Zap size={14} color="white" strokeWidth={2} />
        </motion.button>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-semibold leading-none" style={{ color: "var(--text-1)" }}>
                Mission Control
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                AI Command Center
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Agent list */}
      <nav className="flex-1 overflow-y-auto py-3" style={{ padding: collapsed ? "12px 10px" : "12px 10px" }}>
        {!collapsed && (
          <p
            className="text-[10px] font-semibold tracking-widest uppercase mb-2 px-2"
            style={{ color: "var(--text-3)" }}
          >
            Conversations
          </p>
        )}

        {AGENTS.map((agent) => {
          const isActive = pathname === `/chat/${agent.id}`;
          const isClaude = agent.id === "claude";

          return (
            <Link key={agent.id} href={`/chat/${agent.id}`} prefetch>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                transition={{ duration: 0.12 }}
                className="sidebar-item flex items-center gap-3 rounded-xl mb-0.5 cursor-pointer relative"
                style={{
                  padding: collapsed ? "10px" : "9px 10px",
                  background: isActive ? `${agent.color}10` : "transparent",
                  borderLeft: isActive ? `2px solid ${agent.color}` : "2px solid transparent",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}
                title={collapsed ? agent.name : undefined}
              >
                <AgentAvatar
                  agent={agent}
                  size={34}
                  showStatus
                  status={isClaude ? "online" : "unknown"}
                />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 min-w-0"
                    >
                      <div
                        className="text-sm font-medium leading-tight truncate"
                        style={{ color: isActive ? "var(--text-1)" : "var(--text-2)" }}
                      >
                        {agent.name}
                      </div>
                      <div
                        className="text-[11px] truncate mt-0.5"
                        style={{ color: "var(--text-3)" }}
                      >
                        {agent.tagline}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!collapsed && isActive && (
                  <ChevronRight size={12} style={{ color: agent.color, flexShrink: 0, opacity: 0.7 }} />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Workspace section divider */}
        <div className="mt-2 mb-2 px-2">
          <div style={{ height: 1, background: "var(--border)" }} />
        </div>

        {!collapsed && (
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-2 px-2" style={{ color: "var(--text-3)" }}>
            Workspace
          </p>
        )}

        {WORKSPACE_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} prefetch>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                transition={{ duration: 0.12 }}
                className="sidebar-item flex items-center gap-3 rounded-xl mb-0.5 cursor-pointer"
                style={{
                  padding: collapsed ? "10px" : "9px 10px",
                  background: isActive ? `${item.color}10` : "transparent",
                  borderLeft: isActive ? `2px solid ${item.color}` : "2px solid transparent",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}
                title={collapsed ? item.label : undefined}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: `linear-gradient(145deg, ${item.gradientFrom}, ${item.gradientTo})`,
                    boxShadow: `0 2px 8px ${item.color}28`,
                  }}
                >
                  <item.Icon size={15} color="white" strokeWidth={1.8} />
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 min-w-0"
                    >
                      <div className="text-sm font-medium leading-tight" style={{ color: isActive ? "var(--text-1)" : "var(--text-2)" }}>
                        {item.label}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                        {item.sub}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!collapsed && isActive && (
                  <ChevronRight size={12} style={{ color: item.color, flexShrink: 0, opacity: 0.7 }} />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: settings */}
      <div
        className="flex-shrink-0 p-2"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="sidebar-item flex items-center gap-3 rounded-xl px-2.5 py-2 cursor-pointer"
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          title="Settings"
        >
          <Settings size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs"
                style={{ color: "var(--text-3)" }}
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
