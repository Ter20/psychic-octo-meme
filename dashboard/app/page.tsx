"use client";
import Link from "next/link";
import { AGENTS } from "@/lib/agents";
import AgentAvatar from "@/components/AgentAvatar";
import { BookOpen, Target, ChevronRight, Zap } from "lucide-react";

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function HomePage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "var(--bg-base)" }}>
      {/* Hero header */}
      <div
        className="flex-shrink-0 px-8 pt-10 pb-8"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 40, height: 40, background: "linear-gradient(145deg, #7c3aed, #4338ca)", boxShadow: "0 2px 16px rgba(124,58,237,0.4)" }}
            >
              <Zap size={18} color="white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-1)" }}>Mission Control</h1>
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{todayLabel()}</p>
            </div>
          </div>
          <p className="text-sm mt-4" style={{ color: "var(--text-2)" }}>
            Your AI command center — chat with agents, write in your journal, track your goals.
          </p>
        </div>
      </div>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* Agents */}
          <section>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-3)" }}>
              AI Agents
            </p>
            <div className="grid grid-cols-1 gap-2">
              {AGENTS.map((agent) => (
                <Link key={agent.id} href={`/chat/${agent.id}`}>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer transition-all duration-150 group"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = `${agent.color}08`;
                      (e.currentTarget as HTMLDivElement).style.borderColor = `${agent.color}30`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                    }}
                  >
                    <AgentAvatar agent={agent} size={38} showStatus status={agent.id === "claude" ? "online" : "unknown"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight" style={{ color: "var(--text-1)" }}>{agent.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>{agent.tagline}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--text-3)", opacity: 0.6 }} />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Workspace */}
          <section>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-3)" }}>
              Workspace
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/journal">
                <div
                  className="rounded-2xl p-5 cursor-pointer"
                  style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}
                >
                  <div
                    className="flex items-center justify-center rounded-xl mb-3"
                    style={{ width: 36, height: 36, background: "linear-gradient(145deg, #059669, #047857)", boxShadow: "0 2px 10px rgba(16,185,129,0.3)" }}
                  >
                    <BookOpen size={16} color="white" strokeWidth={1.8} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Journal</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Daily notes → Obsidian</p>
                </div>
              </Link>

              <Link href="/goals">
                <div
                  className="rounded-2xl p-5 cursor-pointer"
                  style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)" }}
                >
                  <div
                    className="flex items-center justify-center rounded-xl mb-3"
                    style={{ width: 36, height: 36, background: "linear-gradient(145deg, #7c3aed, #4f46e5)", boxShadow: "0 2px 10px rgba(139,92,246,0.3)" }}
                  >
                    <Target size={16} color="white" strokeWidth={1.8} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>Goals</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Track what matters</p>
                </div>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

