import { api } from "../api.js";

function parseCsv(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [query, clicks, impressions, position] = line.split(",");
      return { query: (query || "").trim(), clicks, impressions, position };
    });
}

async function renderTable() {
  const { queries } = await api.seoQueries();
  const tbody = document.querySelector("#seo-table tbody");
  tbody.innerHTML = queries
    .map((q) => `<tr><td>${q.query}</td><td>${q.clicks}</td><td>${q.impressions}</td><td>${q.position}</td></tr>`)
    .join("");
  return queries;
}

export function initSeo() {
  renderTable();

  document.getElementById("seo-import").addEventListener("click", async () => {
    const raw = document.getElementById("seo-csv").value;
    const rows = parseCsv(raw);
    await api.importSeoQueries(rows);
    renderTable();
  });

  document.getElementById("seo-brief").addEventListener("click", async () => {
    const keyword = document.getElementById("seo-keyword").value.trim();
    const output = document.getElementById("seo-brief-output");
    if (!keyword) return;
    output.textContent = "Generating…";
    try {
      const queries = await renderTable();
      const related = queries.map((q) => q.query).slice(0, 8);
      const { brief } = await api.seoBrief(keyword, related);
      output.textContent = JSON.stringify(brief, null, 2);
    } catch (err) {
      output.textContent = `Error: ${err.message}`;
    }
  });

  document.getElementById("seo-deploy").addEventListener("click", async () => {
    try {
      await api.post("/api/seo/deploy");
    } catch (err) {
      alert(err.message);
    }
  });
}
