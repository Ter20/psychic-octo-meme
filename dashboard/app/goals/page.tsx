"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Check, X, Plus, Mic, Loader2 } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

const COLOR = "#8b5cf6";
const G_FROM = "#7c3aed";
const G_TO = "#4f46e5";

interface Goal { id: string; text: string; done: boolean; }
type SaveStatus = "idle" | "saving" | "saved" | "error";
function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── Goal item ────────────────────────────────────────────────────────────────

function GoalItem({ goal, onToggle, onDelete }: {
  goal: Goal;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.22 }}
      className="flex items-center gap-3 group px-4 py-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.026)", border: "1px solid rgba(255,255,255,0.052)" }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(goal.id)}
        className="flex-shrink-0 flex items-center justify-center rounded-md transition-all duration-150"
        style={{
          width: 20, height: 20,
          background: goal.done ? `${COLOR}1e` : "transparent",
          border: `1.5px solid ${goal.done ? COLOR : "rgba(255,255,255,0.18)"}`,
          boxShadow: goal.done ? `0 0 8px ${COLOR}35` : "none",
        }}
      >
        <AnimatePresence>
          {goal.done && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
              <Check size={11} color={COLOR} strokeWidth={2.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Text */}
      <span
        className="flex-1 text-sm leading-relaxed select-none"
        style={{
          color: goal.done ? "var(--text-3)" : "var(--text-1)",
          textDecoration: goal.done ? "line-through" : "none",
          textDecorationColor: "rgba(255,255,255,0.2)",
        }}
      >
        {goal.text}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(goal.id)}
        title="Remove goal"
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity duration-150"
        style={{ color: "var(--text-3)" }}
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ─── Mic button ───────────────────────────────────────────────────────────────

function MicBtn({ status, color, onClick }: { status: "idle" | "listening"; color: string; onClick: () => void }) {
  const isOn = status === "listening";
  return (
    <motion.button
      whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={isOn ? "Stop recording" : "Voice input"}
      className="relative flex-shrink-0 flex items-center justify-center rounded-xl overflow-visible"
      style={{
        width: 30, height: 30,
        background: isOn ? `${color}1a` : "rgba(255,255,255,0.05)",
        border: `1px solid ${isOn ? color + "55" : "rgba(255,255,255,0.07)"}`,
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
      <Mic size={13} color={isOn ? color : "var(--text-3)"} strokeWidth={isOn ? 2.5 : 1.8} />
    </motion.button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load goals on mount
  useEffect(() => {
    fetch("/api/obsidian/goals")
      .then((r) => r.json())
      .then((d) => setGoals(d.goals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const persistGoals = useCallback(async (list: Goal[]) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/obsidian/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: list }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch { setSaveStatus("error"); }
    finally {
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }, []);

  const scheduleSave = useCallback((list: Goal[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistGoals(list), 500);
  }, [persistGoals]);

  const addGoal = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const updated = [{ id: uid(), text, done: false }, ...goals];
    setGoals(updated);
    setInput("");
    scheduleSave(updated);
    inputRef.current?.focus();
  }, [input, goals, scheduleSave]);

  const toggleGoal = useCallback((id: string) => {
    const updated = goals.map((g) => g.id === id ? { ...g, done: !g.done } : g);
    setGoals(updated);
    scheduleSave(updated);
  }, [goals, scheduleSave]);

  const deleteGoal = useCallback((id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    scheduleSave(updated);
  }, [goals, scheduleSave]);

  // Voice → append to input
  const { status: voiceStatus, interim: voiceInterim, supported: voiceSupported, toggle: voiceToggle } =
    useVoiceInput((text) => {
      setInput((prev) => prev.trimEnd() ? `${prev.trimEnd()} ${text}` : text);
    });

  const pending = goals.filter((g) => !g.done);
  const done = goals.filter((g) => g.done);

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
            <Target size={16} color="white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight" style={{ color: "var(--text-1)" }}>Goals</h1>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
              {loading ? "Loading…" : `${pending.length} pending · ${done.length} done`}
            </p>
          </div>
        </div>

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
      </div>

      {/* ── Goals list ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={20} style={{ color: COLOR }} className="animate-spin" />
          </div>
        ) : goals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-64 gap-4 text-center"
          >
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 64, height: 64, background: `${COLOR}10`, border: `1px solid ${COLOR}20` }}
            >
              <Target size={28} style={{ color: COLOR, opacity: 0.5 }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>No goals yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>Add your first goal below</p>
            </div>
          </motion.div>
        ) : (
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            {pending.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-3)" }}>
                  In progress · {pending.length}
                </p>
                <div className="flex flex-col gap-2">
                  <AnimatePresence mode="popLayout">
                    {pending.map((g) => <GoalItem key={g.id} goal={g} onToggle={toggleGoal} onDelete={deleteGoal} />)}
                  </AnimatePresence>
                </div>
              </section>
            )}
            {done.length > 0 && (
              <section>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--text-3)" }}>
                  Completed · {done.length}
                </p>
                <div className="flex flex-col gap-2">
                  <AnimatePresence mode="popLayout">
                    {done.map((g) => <GoalItem key={g.id} goal={g} onToggle={toggleGoal} onDelete={deleteGoal} />)}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ── Add goal input ── */}
      <div className="flex-shrink-0 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-2xl mx-auto">
          <motion.div
            animate={{
              boxShadow: voiceStatus === "listening"
                ? `0 0 0 1px ${COLOR}88, 0 4px 28px ${COLOR}22`
                : "0 0 0 1px rgba(255,255,255,0.07)",
            }}
            transition={{ duration: 0.3 }}
            className="flex flex-col rounded-2xl px-4 pt-3 pb-2.5 gap-2"
            style={{ background: "var(--bg-input)" }}
          >
            {/* Interim voice preview */}
            <AnimatePresence>
              {voiceStatus === "listening" && voiceInterim && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-xs overflow-hidden" style={{ color: COLOR }}
                >
                  <span className="flex gap-0.5">
                    {[0,1,2].map((i) => <span key={i} className="typing-dot inline-block w-1 h-1 rounded-full" style={{ background: COLOR, animationDelay: `${i*0.18}s` }} />)}
                  </span>
                  <span className="italic opacity-80 truncate">{voiceInterim}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <Plus size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
                placeholder={voiceStatus === "listening" ? "Listening…" : "Add a goal… (⏎ to add)"}
                className="flex-1 bg-transparent text-sm outline-none mono"
                style={{ color: "var(--text-1)", caretColor: COLOR }}
              />
              {voiceSupported && <MicBtn status={voiceStatus} color={COLOR} onClick={voiceToggle} />}
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                onClick={addGoal} disabled={!input.trim()}
                className="flex-shrink-0 flex items-center justify-center rounded-xl"
                style={{
                  width: 30, height: 30,
                  background: input.trim() ? `linear-gradient(145deg, ${G_FROM}, ${G_TO})` : "rgba(255,255,255,0.05)",
                  boxShadow: input.trim() ? `0 2px 12px ${COLOR}40` : "none",
                }}
              >
                <Plus size={13} color={input.trim() ? "white" : "var(--text-3)"} />
              </motion.button>
            </div>
          </motion.div>
          <p className="text-center text-[10px] mt-2 mono" style={{ color: "var(--text-3)" }}>
            ⏎ add{voiceSupported ? " · 🎤 voice" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
