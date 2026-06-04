"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Mic } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

const COLOR = "#10b981";
const G_FROM = "#059669";
const G_TO = "#047857";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function todayStr() { return new Date().toISOString().slice(0, 10); }

function shiftDate(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function displayDate(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
    long: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  };
}

// ─── Small nav button ─────────────────────────────────────────────────────────

function NavBtn({ icon, onClick, title, disabled }: {
  icon: React.ReactNode; onClick: () => void; title: string; disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.1 }} whileTap={disabled ? {} : { scale: 0.9 }}
      onClick={disabled ? undefined : onClick} title={title}
      className="flex items-center justify-center rounded-lg"
      style={{
        width: 28, height: 28,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        color: disabled ? "var(--text-3)" : "var(--text-2)",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {icon}
    </motion.button>
  );
}

// ─── Mic button ───────────────────────────────────────────────────────────────

function MicBtn({ status, color, onClick }: { status: "idle" | "listening"; color: string; onClick: () => void }) {
  const isOn = status === "listening";
  return (
    <motion.button
      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
      onClick={onClick} title={isOn ? "Stop recording" : "Dictate into journal"}
      className="relative flex items-center justify-center rounded-xl overflow-visible flex-shrink-0"
      style={{
        width: 36, height: 36,
        background: isOn ? `${color}18` : "rgba(255,255,255,0.05)",
        border: `1px solid ${isOn ? color + "55" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {isOn && (
        <motion.span
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: `1px solid ${color}` }}
          animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <Mic size={15} color={isOn ? color : "var(--text-3)"} strokeWidth={isOn ? 2.5 : 1.8} />
    </motion.button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const [currentDate, setCurrentDate] = useState(todayStr());
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs keep the latest values accessible in cleanup without re-creating effects
  const contentRef = useRef(content);
  const dateRef = useRef(currentDate);
  contentRef.current = content;
  dateRef.current = currentDate;

  // Save on unmount to avoid losing unsaved content
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (contentRef.current) {
        fetch("/api/obsidian/journal", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateRef.current, content: contentRef.current }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, []);

  // Load entry whenever the displayed date changes
  useEffect(() => {
    setLoading(true);
    setContent("");
    fetch(`/api/obsidian/journal?date=${currentDate}`)
      .then((r) => r.json())
      .then((d) => setContent(d.content ?? ""))
      .catch(() => setContent(""))
      .finally(() => setLoading(false));
  }, [currentDate]);

  // Resize textarea to fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content, loading]);

  const persistContent = useCallback(async (text: string, date: string) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/obsidian/journal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, content: text }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch { setSaveStatus("error"); }
    finally {
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }, []);

  const handleChange = (newContent: string) => {
    setContent(newContent);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistContent(newContent, currentDate), 1400);
  };

  const navigate = (delta: number) => {
    // Flush any pending save before switching dates
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      persistContent(content, currentDate);
    }
    setCurrentDate((d) => shiftDate(d, delta));
  };

  const today = todayStr();
  const isToday = currentDate === today;
  const { weekday, long: longDate } = displayDate(currentDate);
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Voice → append to journal with a paragraph break
  const { status: voiceStatus, interim: voiceInterim, supported: voiceSupported, toggle: voiceToggle } =
    useVoiceInput((text) => {
      const appended = content.trimEnd() ? `${content.trimEnd()}\n\n${text}` : text;
      handleChange(appended);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ height: 60, borderBottom: "1px solid var(--border)", background: "rgba(12,12,24,0.7)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: `linear-gradient(145deg, ${G_FROM}, ${G_TO})`, boxShadow: `0 2px 12px ${COLOR}40` }}
          >
            <BookOpen size={16} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight" style={{ color: "var(--text-1)" }}>Journal</h1>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
              {isToday ? "Today" : longDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          <AnimatePresence>
            {saveStatus !== "idle" && (
              <motion.span
                key={saveStatus}
                initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="text-[11px] mono"
                style={{ color: saveStatus === "saved" ? "#34d399" : saveStatus === "error" ? "#f87171" : "var(--text-3)" }}
              >
                {saveStatus === "saving" ? "saving…" : saveStatus === "saved" ? "✓ saved to vault" : "vault error"}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <NavBtn icon={<ChevronLeft size={14} />} onClick={() => navigate(-1)} title="Previous day" />
            <AnimatePresence>
              {!isToday && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setCurrentDate(today)}
                  className="text-[11px] px-2 py-1 rounded-lg mono"
                  style={{ background: `${COLOR}15`, border: `1px solid ${COLOR}28`, color: COLOR }}
                >
                  Today
                </motion.button>
              )}
            </AnimatePresence>
            <NavBtn icon={<ChevronRight size={14} />} onClick={() => navigate(1)} title="Next day" disabled={isToday} />
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Date heading */}
          <motion.div key={currentDate} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-[11px] tracking-widest uppercase mono" style={{ color: "var(--text-3)" }}>{weekday}</p>
            <h2 className="text-2xl font-semibold mt-1" style={{ color: "var(--text-1)" }}>{longDate}</h2>
            <div className="mt-4" style={{ height: 1, background: "var(--border)" }} />
          </motion.div>

          {/* Textarea or skeleton */}
          {loading ? (
            <div className="space-y-4">
              {[1, 0.8, 0.95, 0.7, 0.85].map((w, i) => (
                <div
                  key={i} className="h-4 rounded-md animate-pulse"
                  style={{ width: `${w * 100}%`, background: "rgba(255,255,255,0.05)", animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={"What's on your mind today?\n\nWrite freely — this is your space."}
              className="w-full bg-transparent outline-none resize-none"
              style={{
                color: "var(--text-1)",
                fontSize: 15,
                lineHeight: 1.9,
                caretColor: COLOR,
                minHeight: 320,
              }}
            />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="flex-shrink-0 px-6 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* Voice control + interim preview */}
        <div className="flex items-center gap-3">
          {voiceSupported && <MicBtn status={voiceStatus} color={COLOR} onClick={voiceToggle} />}
          <AnimatePresence>
            {voiceStatus === "listening" && (
              <motion.div
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                className="flex items-center gap-1.5 text-xs" style={{ color: COLOR }}
              >
                {[0,1,2].map((i) => (
                  <span key={i} className="typing-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: COLOR, animationDelay: `${i*0.18}s` }} />
                ))}
                {voiceInterim && (
                  <span className="italic opacity-70 ml-1 max-w-[280px] truncate">{voiceInterim}</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Word count */}
        <p className="text-[11px] mono" style={{ color: "var(--text-3)" }}>
          {wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? "s" : ""}` : "Start writing…"}
        </p>
      </div>
    </div>
  );
}
