const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const API_PREFIX = "/api/v1";

export function apiUrl(path: string) {
  if (path.startsWith("http")) return path;
  return API_BASE.replace(/\/$/, "") + API_PREFIX + path;
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), init);
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      msg = j?.detail || j?.message || JSON.stringify(j);
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export const api = {
  dashboard: (recentLimit = 40) =>
    jsonFetch<{ serverTime: string; kpis: any; pricing: any; kiosks: any[]; recentSessions: any[] }>(`/dashboard?recentLimit=${recentLimit}`),

  kiosks: () => jsonFetch<any[]>(`/kiosks`),
  addKiosk: (name: string) =>
    jsonFetch<any>(`/kiosks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }),
  renameKiosk: (id: string, name: string) =>
    jsonFetch<any>(`/kiosks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }),
  deleteKiosk: (id: string) => jsonFetch<any>(`/kiosks/${id}`, { method: "DELETE" }),

  pricing: () => jsonFetch<any>(`/pricing`),
  updatePricing: (payload: any) =>
    jsonFetch<any>(`/pricing`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),

  sessions: (qs: string) => jsonFetch<any>(`/vehicle-sessions${qs}`),
  exportCsv: (qs: string) => apiUrl(`/vehicle-sessions/export${qs}`),

  simulateTelemetry: (kioskId: string) =>
    jsonFetch<any>(`/simulator/telemetry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kioskId }) }),
  simulateEntry: (kioskId: string, vehicleType?: string) =>
    jsonFetch<any>(`/simulator/vehicle-entry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kioskId, vehicleType }) }),
  simulateExit: (kioskId: string) =>
    jsonFetch<any>(`/simulator/vehicle-exit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kioskId }) }),

  eventsStreamUrl: (afterId: number) => apiUrl(`/events/stream?after_id=${afterId}`),
  events: (afterId: number) => jsonFetch<any>(`/events?after_id=${afterId}&limit=200`)
};
