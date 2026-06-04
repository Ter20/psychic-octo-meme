"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceStatus = "idle" | "listening";

export function useVoiceInput(onFinal: (text: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [interim, setInterim] = useState("");

  // Keep onFinal stable via ref to avoid recreating the recognition on every render
  const cbRef = useRef(onFinal);
  useEffect(() => { cbRef.current = onFinal; }, [onFinal]);

  const recRef = useRef<SpeechRecognition | null>(null);

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stop = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setStatus("idle");
    setInterim("");
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    // Stop any existing session first
    recRef.current?.abort();

    const rec = new SR();
    rec.continuous = true;      // keep listening until explicitly stopped
    rec.interimResults = true;  // show partial results as the user speaks
    rec.lang = navigator.language || "en-US";

    rec.onstart = () => setStatus("listening");

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interimAcc = "";
      let finalAcc = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalAcc += transcript;
        } else {
          interimAcc += transcript;
        }
      }

      setInterim(interimAcc);

      if (finalAcc.trim()) {
        cbRef.current(finalAcc.trim());
        setInterim("");
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are expected — don't surface as errors
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("SpeechRecognition error:", event.error);
      }
      setStatus("idle");
      setInterim("");
    };

    rec.onend = () => {
      setStatus("idle");
      setInterim("");
    };

    recRef.current = rec;
    rec.start();
  }, []);

  const toggle = useCallback(() => {
    if (status === "listening") stop();
    else start();
  }, [status, start, stop]);

  // Abort on unmount
  useEffect(() => () => { recRef.current?.abort(); }, []);

  return { status, interim, supported, toggle, stop };
}
