import { api } from "../api.js";

const COLUMN_LABELS = {
  backlog: "Backlog",
  triage: "Triage",
  active: "Active / Running",
  blocked: "Blocked",
  done: "Done",
};

async function render() {
  const board = document.getElementById("kanban-board");
  const { columns, cards } = await api.kanban();
  board.innerHTML = "";

  for (const col of columns) {
    const colEl = document.createElement("div");
    colEl.className = "kanban-col";
    colEl.dataset.column = col;
    colEl.innerHTML = `<h4>${COLUMN_LABELS[col] || col}</h4>`;

    for (const card of cards.filter((c) => c.column === col)) {
      const cardEl = document.createElement("div");
      cardEl.className = "kanban-card";
      cardEl.draggable = true;
      cardEl.dataset.id = card.id;
      cardEl.textContent = card.title;
      cardEl.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", card.id);
      });
      colEl.appendChild(cardEl);
    }

    colEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      colEl.classList.add("drag-over");
    });
    colEl.addEventListener("dragleave", () => colEl.classList.remove("drag-over"));
    colEl.addEventListener("drop", async (e) => {
      e.preventDefault();
      colEl.classList.remove("drag-over");
      const id = e.dataTransfer.getData("text/plain");
      await api.moveCard(id, col);
      render();
    });

    board.appendChild(colEl);
  }
}

export function initKanban() {
  document.getElementById("kanban-add").addEventListener("click", async () => {
    const input = document.getElementById("kanban-new-title");
    const title = input.value.trim();
    if (!title) return;
    input.value = "";
    await api.addCard(title);
    render();
  });
  render();
}
