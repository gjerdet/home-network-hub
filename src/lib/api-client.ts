// API client that uses REST API in production, localStorage in development
const API_BASE = "/api";

// Detect if API is available (production Docker environment)
let useApi: boolean | null = null;

async function isApiAvailable(): Promise<boolean> {
  if (useApi !== null) return useApi;
  try {
    const res = await fetch(`${API_BASE}/health`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(2000),
    });
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) {
      useApi = false;
      return useApi;
    }
    const data = await res.json().catch(() => null);
    useApi = data?.status === "ok";
  } catch {
    useApi = false;
  }
  return useApi;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`POST ${path} failed: ${res.status}`, text);
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

async function apiPut(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

export { isApiAvailable, apiGet, apiPost, apiPut, apiDelete, API_BASE };
