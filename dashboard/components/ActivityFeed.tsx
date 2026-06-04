"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, MessageSquare, Wrench, Zap, AlertCircle, CheckCircle } from "lucide-react";

type EventType = "message" | "tool" | "session" | "error" | "success";
type FeedEvent = {
  id: string;
  type: EventType;
  label: string;
  detail?: string;
  ts: Date;
};

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  message: <MessageSquare size={11} />,
  tool:    <Wrench size={11} />,
  session: <Zap size={11} />,
  error:   <AlertCircle size={11} />,
  success: <CheckCircle size={11} />,
};

const EVENT_COLORS: Record<EventType, string> = {
  message: "#8b5cf6",
  tool:    "#f97316",
  session: "#3b82f6",
  error:   "#ef4444",
  success: "#10b981",
};

// Global event bus (simple module-level store)
type Listener = (event: FeedEvent) => void;
const listeners: Listener[] = [];
export function emitFeedEvent(event: Omit<FeedEvent, "id" | "ts">) {
  const full: FeedEvent = { ...event, id: Math.random().toString(36).slice(2), ts: new Date() };
  listeners.forEach((fn) => fn(full));
}

function useFeed(max = 50) {
  const [events, setEvents] = useState<FeedEvent[]>(() => [
    { id: "init", type: "session", label: "Mission Control online", ts: new Date() },
  ]);

  useEffect(() => {
    const fn: Listener = (e) => {
      setEvents((prev) => [e, ...prev].slice(0, max));
    };
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, [max]);

  return events;
}

export default function ActivityFeed() {
  const events = useFeed();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-panel rounded-2xl overflow-hidden flex flex-col"
      style={{ maxHeight: 320 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] flex-shrink-0"
        style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.08) 0%, transparent 100%)" }}
      >
        <Radio size={13} className="text-blue-400" />
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Activity Feed</span>
        <span
          className="ml-auto text-[10px] terminal-font"
          style={{ color: "#3b82f6" }}
        >
          LIVE
        </span>
      </div>

      {/* Events */}
      <div className="overflow-y-auto flex-1 p-3 space-y-1">
        <AnimatePresence initial={false}>
          {events.map((evt) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, x: -10, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <span
                className="mt-0.5 flex-shrink-0"
                style={{ color: EVENT_COLORS[evt.type] }}
              >
                {EVENT_ICONS[evt.type]}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-300">{evt.label}</span>
                {evt.detail && (
                  <p className="text-[10px] text-slate-600 truncate terminal-font">{evt.detail}</p>
                )}
              </div>
              <span className="text-[10px] text-slate-600 terminal-font flex-shrink-0">
                {evt.ts.toLocaleTimeString("en-US", { hour12: false })}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
