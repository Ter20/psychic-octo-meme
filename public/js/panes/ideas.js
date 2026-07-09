import { api } from "../api.js";

const STAGE_LABELS = {
  idea_backlog: "Idea Backlog",
  auto_plan: "Auto Plan & Shape",
  human_approval: "Human Approval",
  build: "Build & Live Preview",
  done: "Done",
};

const activeStreams = new Map(); // ideaId -> EventSource

function runStatusBadgeClass(score) {
  return score >= 90 ? "pass" : "fail";
}

function renderRunPanel(container, ideaId, runId) {
  container.innerHTML = `
    <div class="run-log" id="run-log-${ideaId}"></div>
    <div id="run-score-${ideaId}"></div>
    <div id="run-actions-${ideaId}"></div>
    <a href="/preview/runs/${runId}/files/" target="_blank" class="ghost-btn" style="display:inline-block;text-decoration:none;">Open live preview</a>
  `;

  if (activeStreams.has(ideaId)) {
    activeStreams.get(ideaId).close();
  }

  const source = new EventSource(`/api/loop/${runId}/stream`);
  activeStreams.set(ideaId, source);

  const logEl = () => document.getElementById(`run-log-${ideaId}`);
  const scoreEl = () => document.getElementById(`run-score-${ideaId}`);
  const actionsEl = () => document.getElementById(`run-actions-${ideaId}`);

  const appendLog = (line) => {
    const el = logEl();
    if (!el) return;
    el.innerHTML += `<div>${line}</div>`;
    el.scrollTop = el.scrollHeight;
  };

  source.addEventListener("snapshot", (e) => {
    const run = JSON.parse(e.data);
    run.log.forEach((entry) => appendLog(entry.line));
    if (run.bestScore) {
      scoreEl().innerHTML = `<span class="run-score ${runStatusBadgeClass(run.bestScore)}">Best score: ${run.bestScore}/100</span>`;
    }
    renderActionsForStatus(run.status, ideaId, runId, actionsEl());
  });

  source.addEventListener("log", (e) => appendLog(JSON.parse(e.data).line));

  source.addEventListener("round", (e) => {
    const round = JSON.parse(e.data);
    scoreEl().innerHTML = `<span class="run-score ${runStatusBadgeClass(round.score)}">Round ${round.round} score: ${round.score}/100</span>`;
  });

  source.addEventListener("status", (e) => {
    const { status } = JSON.parse(e.data);
    renderActionsForStatus(status, ideaId, runId, actionsEl());
    if (["published", "rejected", "error", "blocked"].includes(status)) {
      source.close();
      activeStreams.delete(ideaId);
    }
  });
}

function renderActionsForStatus(status, ideaId, runId, actionsEl) {
  if (!actionsEl) return;
  if (status === "awaiting_approval") {
    actionsEl.innerHTML = `<button data-approve="${runId}" data-idea="${ideaId}">✅ Approve & publish</button> <button data-reject="${runId}" data-idea="${ideaId}">✋ Reject</button>`;
  } else if (status === "needs_human") {
    actionsEl.innerHTML = `<span class="muted">Max rounds reached without passing - needs a human look.</span>`;
  } else {
    actionsEl.innerHTML = `<span class="muted">Status: ${status}</span>`;
  }
}

async function render() {
  const board = document.getElementById("idea-board");
  const { stages, ideas } = await api.ideas();
  board.innerHTML = "";

  for (const stage of stages) {
    const colEl = document.createElement("div");
    colEl.className = "idea-col";
    colEl.innerHTML = `<h4>${STAGE_LABELS[stage] || stage}</h4>`;

    for (const idea of ideas.filter((i) => i.stage === stage)) {
      const card = document.createElement("div");
      card.className = "idea-card";
      const dod = idea.definitionOfDone ? `<div class="dod">${idea.definitionOfDone}</div>` : "";
      let actions = "";
      if (stage === "idea_backlog") {
        actions = `<button data-shape="${idea.id}">✨ Auto Plan &amp; Shape</button>`;
      } else if (stage === "human_approval") {
        actions = `<button data-build="${idea.id}">🚀 Approve &amp; Build</button>`;
      }
      card.innerHTML = `<strong>${idea.title}</strong>${dod}${actions}<div class="run-container" data-run-container="${idea.id}"></div>`;
      colEl.appendChild(card);

      if (idea.runId && (stage === "build" || stage === "done")) {
        renderRunPanel(card.querySelector(".run-container"), idea.id, idea.runId);
      }
    }

    board.appendChild(colEl);
  }

  board.querySelectorAll("[data-shape]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Shaping…";
      await api.shapeIdea(btn.dataset.shape);
      render();
    })
  );
  board.querySelectorAll("[data-build]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Starting build…";
      await api.buildIdea(btn.dataset.build);
      render();
    })
  );
  board.addEventListener("click", async (e) => {
    if (e.target.dataset.approve) {
      await api.approveRun(e.target.dataset.approve);
      render();
    } else if (e.target.dataset.reject) {
      await api.rejectRun(e.target.dataset.reject);
      render();
    }
  });
}

export function initIdeas() {
  document.getElementById("idea-add").addEventListener("click", async () => {
    const input = document.getElementById("idea-new-title");
    const title = input.value.trim();
    if (!title) return;
    input.value = "";
    await api.addIdea(title);
    render();
  });
  render();
}
