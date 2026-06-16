"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Check, AlertCircle, Eye, EyeOff, RefreshCw } from "lucide-react";

const COLOR = "#6366f1";
const G_FROM = "#4f46e5";
const G_TO = "#3730a3";

interface KeyConfig {
  key: string;
  label: string;
  hint: string;
  placeholder: string;
}

const KEYS: KeyConfig[] = [
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic API Key",
    hint: "Powers the Claude chat tab directly. Get yours at console.anthropic.com",
    placeholder: "sk-ant-...",
  },
  {
    key: "OPENROUTER_API_KEY",
    label: "OpenRouter API Key",
    hint: "Powers Hermes (NousResearch Hermes-3). Get yours at openrouter.ai",
    placeholder: "sk-or-v1-...",
  },
  {
    key: "OPENAI_API_KEY",
    label: "OpenAI API Key",
    hint: "Powers Sentinel (GPT-4o) and Forge (o3-mini). Get yours at platform.openai.com",
    placeholder: "sk-proj-...",
  },
  {
    key: "OPENCLAW_GATEWAY_TOKEN",
    label: "OpenClaw Gateway Token",
    hint: "From ~/.openclaw/openclaw.json → gateway.auth.token",
    placeholder: "your-openclaw-token",
  },
  {
    key: "OBSIDIAN_VAULT",
    label: "Obsidian Vault Path",
    hint: "Full path to your Obsidian vault folder (for Journal & Goals auto-save)",
    placeholder: "C:\\Users\\you\\Documents\\ObsidianVault",
  },
  {
    key: "ANTHROPIC_MODEL",
    label: "Claude Model Override",
    hint: "Which Claude model to use via API. Default: claude-sonnet-4-6",
    placeholder: "claude-sonnet-4-6",
  },
];

type SaveState = "idle" | "saving" | "saved" | "error";

function KeyRow({ config, currentMasked, isSet }: { config: KeyConfig; currentMasked: string; isSet: boolean }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const save = async () => {
    setSaveState("saving");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: config.key, value }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaveState("saved");
        setValue("");
      } else {
        setErrorMsg(data.error ?? "Unknown error");
        setSaveState("error");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
      setSaveState("error");
    }
    setTimeout(() => setSaveState("idle"), 3000);
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{config.label}</p>
            {isSet && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: "#10b98118", color: "#10b981", border: "1px solid #10b98130" }}
              >
                set
              </span>
            )}
          </div>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>{config.hint}</p>
        </div>
        {isSet && (
          <span className="text-[11px] font-mono flex-shrink-0" style={{ color: "var(--text-3)" }}>
            {currentMasked}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && value.trim() && save()}
            placeholder={isSet ? "Enter new value to update…" : config.placeholder}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none pr-9"
            style={{
              background: "var(--bg-input)",
              border: `1px solid ${value ? COLOR + "55" : "var(--border)"}`,
              color: "var(--text-1)",
              caretColor: COLOR,
            }}
          />
          <button
            onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-3)" }}
          >
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={save}
          disabled={!value.trim() || saveState === "saving"}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0"
          style={{
            background: value.trim() ? `linear-gradient(135deg, ${G_FROM}, ${G_TO})` : "rgba(255,255,255,0.05)",
            color: value.trim() ? "white" : "var(--text-3)",
            cursor: value.trim() ? "pointer" : "not-allowed",
          }}
        >
          <AnimatePresence mode="wait">
            {saveState === "saving" ? (
              <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RefreshCw size={13} className="animate-spin" />
              </motion.span>
            ) : saveState === "saved" ? (
              <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Check size={13} />
              </motion.span>
            ) : saveState === "error" ? (
              <motion.span key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AlertCircle size={13} />
              </motion.span>
            ) : null}
          </AnimatePresence>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : saveState === "error" ? "Error" : "Save"}
        </motion.button>
      </div>

      {saveState === "error" && errorMsg && (
        <p className="text-[11px] mt-2" style={{ color: "#f87171" }}>{errorMsg}</p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<Record<string, { masked: string; set: boolean }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setKeys(d.keys ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 flex-shrink-0"
        style={{ height: 60, borderBottom: "1px solid var(--border)", background: "rgba(12,12,24,0.7)", backdropFilter: "blur(16px)" }}
      >
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 36, height: 36, background: `linear-gradient(145deg, ${G_FROM}, ${G_TO})`, boxShadow: `0 2px 12px ${COLOR}40` }}
        >
          <Settings size={16} color="white" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight" style={{ color: "var(--text-1)" }}>Settings</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>API keys & configuration</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div
            className="rounded-2xl px-4 py-3 mb-8 flex items-start gap-3"
            style={{ background: `${COLOR}10`, border: `1px solid ${COLOR}25` }}
          >
            <AlertCircle size={15} style={{ color: COLOR, flexShrink: 0, marginTop: 1 }} />
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-2)" }}>
              Keys are saved to <span className="font-mono" style={{ color: "var(--text-1)" }}>.env.local</span> on your machine.
              {" "}<strong>Restart the dev server</strong> after saving for changes to take effect.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 0.9, 0.95, 0.85, 0.9, 0.8].map((w, i) => (
                <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)", width: `${w * 100}%` }} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {KEYS.map((cfg) => (
                <KeyRow
                  key={cfg.key}
                  config={cfg}
                  currentMasked={keys[cfg.key]?.masked ?? ""}
                  isSet={keys[cfg.key]?.set ?? false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
