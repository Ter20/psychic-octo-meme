import { api } from "../api.js";

function fmtTokens(n) {
  if (n > 999) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export async function renderSidebar() {
  const list = document.getElementById("agent-list");
  const { profiles } = await api.agents();

  list.innerHTML = "";
  for (const p of profiles) {
    const el = document.createElement("div");
    el.className = "agent-card";
    el.innerHTML = `
      <div class="agent-card-top">
        <span class="agent-label"><span class="status-dot status-${p.status}"></span>${p.label}</span>
        <input type="checkbox" class="switch" ${p.enabled ? "checked" : ""} />
      </div>
      <div class="agent-meta">${p.provider} · ${p.model}</div>
      <div class="agent-meta">${p.status}${p.latencyMs ? ` · ${p.latencyMs}ms` : ""} · ${fmtTokens(
        (p.usage?.inputTokens || 0) + (p.usage?.outputTokens || 0)
      )} tok · ${p.usage?.calls || 0} calls</div>
    `;
    el.querySelector(".switch").addEventListener("change", async (e) => {
      await api.updateAgent(p.id, { enabled: e.target.checked });
    });
    list.appendChild(el);
  }

  return profiles;
}

export function startSidebarPolling(intervalMs = 8000) {
  renderSidebar();
  setInterval(renderSidebar, intervalMs);
}
