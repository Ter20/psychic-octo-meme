import { startSidebarPolling } from "./panes/sidebar.js";
import { initChat } from "./panes/chat.js";
import { initKanban } from "./panes/kanban.js";
import { initIdeas } from "./panes/ideas.js";
import { initSeo } from "./panes/seo.js";
import { initMemory } from "./panes/memory.js";

function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
    });
  });
}

async function checkServer() {
  const el = document.getElementById("server-status");
  try {
    await fetch("/healthz");
    el.textContent = "● connected";
  } catch {
    el.textContent = "● offline";
  }
}

initTabs();
checkServer();
startSidebarPolling();
initChat();
initKanban();
initIdeas();
initSeo();
initMemory();
