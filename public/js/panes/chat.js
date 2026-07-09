import { api } from "../api.js";

const history = [];
let recognizer = null;
let listening = false;

function appendBubble(role, text) {
  const log = document.getElementById("chat-log");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role === "user" ? "user" : "agent"}`;
  bubble.textContent = text;
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
}

async function populateProfileSelect() {
  const select = document.getElementById("chat-profile");
  const { profiles } = await api.agents();
  select.innerHTML = profiles
    .filter((p) => p.enabled)
    .map((p) => `<option value="${p.id}">${p.label}</option>`)
    .join("");
}

async function sendMessage(text) {
  appendBubble("user", text);
  history.push({ role: "user", content: text });
  const profileId = document.getElementById("chat-profile").value;
  try {
    const { reply, usedFallback, profileId: usedProfile } = await api.chat(profileId, history);
    history.push({ role: "assistant", content: reply });
    appendBubble("agent", usedFallback ? `[fell back to ${usedProfile}]\n${reply}` : reply);
    if (document.getElementById("voice-speak-replies").checked) {
      speak(reply);
    }
  } catch (err) {
    appendBubble("agent", `Error: ${err.message}`);
  }
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g, " (code block omitted) "));
  window.speechSynthesis.speak(utterance);
}

function setupVoice() {
  const button = document.getElementById("voice-toggle");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    button.textContent = "🎤 Voice unsupported in this browser";
    button.disabled = true;
    return;
  }

  recognizer = new SpeechRecognition();
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.lang = "en-US";

  recognizer.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("chat-input").value = transcript;
    sendMessage(transcript);
  };
  recognizer.onend = () => {
    listening = false;
    button.textContent = "🎤 Start voice";
  };
  recognizer.onerror = () => {
    listening = false;
    button.textContent = "🎤 Start voice";
  };

  button.addEventListener("click", () => {
    if (listening) {
      recognizer.stop();
      return;
    }
    listening = true;
    button.textContent = "⏹ Listening…";
    recognizer.start();
  });
}

export async function initChat() {
  await populateProfileSelect();
  setupVoice();

  document.getElementById("chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendMessage(text);
  });
}
