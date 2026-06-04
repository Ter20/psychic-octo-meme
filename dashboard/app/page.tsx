"use client";
import { motion } from "framer-motion";
import AuroraBackground from "@/components/AuroraBackground";
import SystemHeader from "@/components/SystemHeader";
import ClaudePanel from "@/components/ClaudePanel";
import AgentGrid from "@/components/AgentGrid";
import ActivityFeed from "@/components/ActivityFeed";
import QuickStats from "@/components/QuickStats";

export default function Home() {
  return (
    <div className="relative min-h-screen" style={{ color: "#e2e8f0" }}>
      <AuroraBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <SystemHeader activeAgents={4} />

        <main className="flex-1 p-4 md:p-6 flex flex-col gap-5 max-w-[1600px] mx-auto w-full">
          {/* Hero title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-baseline gap-3"
          >
            <h2 className="text-2xl font-bold gradient-text tracking-tight">
              AI Mission Control
            </h2>
            <span className="text-slate-600 text-sm terminal-font hidden sm:block">
              // unified command center
            </span>
          </motion.div>

          {/* Stats row */}
          <QuickStats />

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 flex-1 min-h-0">
            {/* Left: Claude panel */}
            <div style={{ minHeight: 520 }}>
              <ClaudePanel />
            </div>

            {/* Right sidebar */}
            <div className="flex flex-col gap-5">
              <AgentGrid />
              <ActivityFeed />
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center pb-4"
          >
            <p className="text-[10px] terminal-font text-slate-700 tracking-widest">
              MISSION CONTROL v1.0 — CLAUDE CODE CLI BRIDGE — LOCAL
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
