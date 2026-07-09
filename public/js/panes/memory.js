import { api } from "../api.js";

async function renderGoals() {
  const { goals } = await api.goals();
  const list = document.getElementById("goal-list");
  list.innerHTML = "";
  for (const goal of goals) {
    const li = document.createElement("li");
    li.className = goal.done ? "done" : "";
    li.innerHTML = `<input type="checkbox" ${goal.done ? "checked" : ""} /> <span>${goal.text}</span>`;
    li.querySelector("input").addEventListener("change", async (e) => {
      await api.toggleGoal(goal.id, e.target.checked);
      renderGoals();
    });
    list.appendChild(li);
  }
}

async function renderJournal() {
  const { content } = await api.journal();
  document.getElementById("journal-view").textContent = content || "(nothing logged today yet)";
}

function renderGalaxy(nodes, edges) {
  const canvas = document.getElementById("memory-galaxy");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (!nodes.length) {
    ctx.fillStyle = "#8b93a7";
    ctx.font = "12px sans-serif";
    ctx.fillText("No notes in the vault yet", 10, h / 2);
    return;
  }

  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) / 2 - 24;
  const positions = new Map();
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    positions.set(n.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  });

  ctx.strokeStyle = "rgba(110,168,254,0.4)";
  edges.forEach((e) => {
    const a = positions.get(e.source);
    const b = positions.get(e.target);
    if (!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  nodes.forEach((n) => {
    const p = positions.get(n.id);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#7ee787";
    ctx.fill();
    ctx.fillStyle = "#e6e9ef";
    ctx.font = "10px sans-serif";
    ctx.fillText(n.label, p.x + 6, p.y + 3);
  });
}

async function renderResults(query) {
  const container = document.getElementById("memory-results");
  if (!query) {
    container.innerHTML = "";
    return;
  }
  const { results } = await api.searchMemory(query);
  container.innerHTML = results
    .map((r) => `<div class="memory-result"><b>${r.file}</b><div>…${r.snippet}…</div></div>`)
    .join("") || `<div class="memory-result muted">No matches</div>`;
}

export function initMemory() {
  renderGoals();
  renderJournal();
  api.memoryGraph().then(({ nodes, edges }) => renderGalaxy(nodes, edges));

  document.getElementById("goal-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("goal-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await api.addGoal(text);
    renderGoals();
  });

  document.getElementById("journal-save").addEventListener("click", async () => {
    const input = document.getElementById("journal-input");
    const entry = input.value.trim();
    if (!entry) return;
    input.value = "";
    await api.saveJournal(entry);
    renderJournal();
  });

  let searchTimer;
  document.getElementById("memory-search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderResults(e.target.value.trim()), 250);
  });
}
