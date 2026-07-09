async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) throw new Error(data?.error || `${method} ${url} failed (${res.status})`);
  return data;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, body) => request("POST", url, body || {}),
  patch: (url, body) => request("PATCH", url, body || {}),
  put: (url, body) => request("PUT", url, body || {}),
  del: (url) => request("DELETE", url),

  agents: () => api.get("/api/agents"),
  updateAgent: (id, patch) => api.patch(`/api/agents/${id}`, patch),
  testAgent: (id) => api.post(`/api/agents/${id}/test`),

  chat: (profileId, messages) => api.post("/api/chat", { profileId, messages }),

  kanban: () => api.get("/api/kanban"),
  addCard: (title) => api.post("/api/kanban/cards", { title, column: "backlog" }),
  moveCard: (id, column) => api.patch(`/api/kanban/cards/${id}`, { column }),

  ideas: () => api.get("/api/ideas"),
  addIdea: (title) => api.post("/api/ideas", { title }),
  shapeIdea: (id) => api.post(`/api/ideas/${id}/shape`, {}),
  buildIdea: (id) => api.post(`/api/ideas/${id}/build`, {}),

  loopRun: (id) => api.get(`/api/loop/${id}`),
  approveRun: (id) => api.post(`/api/loop/${id}/approve`),
  rejectRun: (id) => api.post(`/api/loop/${id}/reject`),

  seoQueries: () => api.get("/api/seo/queries"),
  importSeoQueries: (rows) => api.post("/api/seo/queries/import", { rows }),
  seoBrief: (keyword, relatedQueries) => api.post("/api/seo/brief", { keyword, relatedQueries }),

  goals: () => api.get("/api/memory/goals"),
  addGoal: (text) => api.post("/api/memory/goals", { text }),
  toggleGoal: (id, done) => api.patch(`/api/memory/goals/${id}`, { done }),

  journal: () => api.get("/api/memory/journal"),
  saveJournal: (entry) => api.post("/api/memory/journal", { entry }),

  searchMemory: (q) => api.get(`/api/memory/search?q=${encodeURIComponent(q)}`),
  memoryGraph: () => api.get("/api/memory/graph"),
};
