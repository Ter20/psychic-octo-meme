"use client";
import { useState, useCallback, useRef } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface ChatSavePayload {
  agentId: string;
  agentName: string;
  user: string;
  assistant: string;
}

export function useObsidianSave() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveChat = useCallback(async (payload: ChatSavePayload) => {
    // Skip empty or boilerplate-only responses
    if (!payload.user.trim() || !payload.assistant.trim()) return;

    setStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      const res = await fetch("/api/obsidian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chat",
          agentName: payload.agentName,
          content: { user: payload.user, assistant: payload.assistant },
          timestamp: new Date().toISOString(),
        }),
      });

      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    } finally {
      timerRef.current = setTimeout(() => setStatus("idle"), 2800);
    }
  }, []);

  return { status, saveChat };
}
