import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Kiosk, ParkingSession, PricingConfig, VehicleType, Kpis } from "./types";
import { api } from "./api";
import { useToast } from "../ui/ToastContext";

type AppDataCtx = {
  kiosks: Kiosk[];
  sessions: ParkingSession[];
  pricing: PricingConfig;
  kpis: Kpis;

  addKiosk: (name: string) => Promise<void>;
  renameKiosk: (id: string, name: string) => Promise<void>;
  deleteKiosk: (id: string) => Promise<void>;

  updatePricing: (next: PricingConfig) => Promise<void>;
  setRate: (vt: VehicleType, rate: number) => Promise<void>;

  fetchSessions: (params: {
    kioskId?: string;
    plate?: string;
    status?: "ALL" | "ACTIVE" | "DONE";
    fromTs?: string;
    toTs?: string;
    page?: number;
    limit?: number;
  }) => Promise<{ items: ParkingSession[]; total: number; page: number; limit: number }>;

  exportCsvUrl: (params: {
    kioskId?: string;
    plate?: string;
    status?: "ALL" | "ACTIVE" | "DONE";
    fromTs?: string;
    toTs?: string;
  }) => string;

  simulateCarIn: (kioskId: string, vehicleType: VehicleType) => Promise<void>;
  simulateCarOut: (kioskId: string) => Promise<void>;
  simulateTelemetry: (kioskId: string) => Promise<void>;
};

function normalizeSession(s: any) {
  if (!s) return s;
  const fee = s.feeVnd ?? s.priceVnd ?? null;
  return { ...s, feeVnd: fee, priceVnd: fee };
}

function normalizeKiosk(k: any) {
  return k;
}

const Ctx = createContext<AppDataCtx | null>(null);

function buildQs(params: Record<string, any>) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === "ALL") return;
    u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : "";
}

export function AppDataProvider(props: { children: React.ReactNode }) {
  const toast = useToast();
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [pricing, setPricing] = useState<PricingConfig>({
    ratePerHour: { MOTORBIKE: 3000, CAR: 5000, TRUCK: 8000 },
    freeMinutes: 15,
    roundingVnd: 1000
  });
  const [kpis, setKpis] = useState<Kpis>({ activeVehicles: 0, revenueTodayVnd: 0, sensorWarnings: 0 });

  const lastEventIdRef = useRef<number>(0);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  async function loadDashboard() {
    const d = await api.dashboard(40);
    setKiosks((d.kiosks||[]).map(normalizeKiosk));
    setSessions((d.recentSessions||[]).map(normalizeSession));
    setPricing(d.pricing);
    setKpis(d.kpis);
  }

  function applyEvent(ev: any) {
    lastEventIdRef.current = Math.max(lastEventIdRef.current, ev.id || 0);

    const kind = ev.kind as string;
    const payload = ev.payload || {};
    const kiosk = payload.kiosk ? normalizeKiosk(payload.kiosk) : null;

    if (kiosk?.id) {
      setKiosks((prev) => {
        const next = prev.slice();
        const idx = next.findIndex((k) => k.id === kiosk.id);
        if (idx >= 0) next[idx] = kiosk;
        else next.unshift(kiosk);
        return next;
      });
    }

    const s = payload.session ? normalizeSession(payload.session) : null;
    if (s?.id) {
      setSessions((prev) => {
        let next = prev.slice();
        const idx = next.findIndex((x) => x.id === s.id);
        if (idx >= 0) next[idx] = s;
        else next = [s, ...next];
        return next.slice(0, 200);
      });
    }

    if (kind === "PRICING_UPDATED" && payload.pricing) {
      setPricing(payload.pricing);
      toast.success("Đã cập nhật giá");
    }

    if (kind === "VEHICLE_ENTRY" || kind === "VEHICLE_EXIT" || kind === "TELEMETRY" || kind.startsWith("SIM_")) {
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = window.setTimeout(() => {
        api.dashboard(40).then((d) => setKpis(d.kpis)).catch(() => {});
      }, 300);
    }
  }

  function startSse() {
    if (esRef.current) esRef.current.close();

    const url = api.eventsStreamUrl(lastEventIdRef.current);
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (m) => {
      try {
        const ev = JSON.parse(m.data);
        applyEvent(ev);
      } catch {}
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      pollOnce().catch(() => {});
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = window.setTimeout(startSse, 1500);
    };
  }

  async function pollOnce() {
    const after = lastEventIdRef.current;
    const resp = await api.events(after);
    for (const ev of resp.events || []) applyEvent(ev);
    lastEventIdRef.current = Math.max(lastEventIdRef.current, resp.lastEventId || after);
  }

  useEffect(() => {
    loadDashboard()
      .then(() => {
        startSse();
        const t = window.setInterval(() => pollOnce().catch(() => {}), 10000);
        return () => window.clearInterval(t);
      })
      .catch((e: any) => toast.error(`Không kết nối được backend: ${String(e?.message || e)}`));

    return () => {
      if (esRef.current) esRef.current.close();
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx: AppDataCtx = useMemo(
    () => ({
      kiosks,
      sessions,
      pricing,
      kpis,

      async addKiosk(name: string) {
        const k = await api.addKiosk(name);
        setKiosks((prev) => [k, ...prev]);
        toast.success("Đã thêm kiot");
      },

      async renameKiosk(id: string, name: string) {
        const k = await api.renameKiosk(id, name);
        setKiosks((prev) => prev.map((x) => (x.id === id ? k : x)));
        toast.success("Đã đổi tên kiot");
      },

      async deleteKiosk(id: string) {
        await api.deleteKiosk(id);
        setKiosks((prev) => prev.filter((x) => x.id !== id));
        toast.success("Đã xóa kiot");
      },

      async updatePricing(next: Partial<PricingConfig>) {
        // NOTE: backend expects a full PricingConfig (all fields required).
        // Settings UI may send partial updates (e.g. only freeMinutes),
        // so we merge with current state to avoid 422 validation errors.
        const merged: PricingConfig = {
          freeMinutes: next.freeMinutes ?? pricing.freeMinutes,
          roundingVnd: next.roundingVnd ?? pricing.roundingVnd,
          ratePerHour: {
            ...pricing.ratePerHour,
            ...(next.ratePerHour ?? {})
          }
        };

        const updated = await api.updatePricing(merged);
        setPricing(updated);
        toast.success("Đã cập nhật cấu hình giá");
      },

      async setRate(vt: VehicleType, rate: number) {
        const next: PricingConfig = { ...pricing, ratePerHour: { ...pricing.ratePerHour, [vt]: rate } };
        await this.updatePricing(next);
      },

      async fetchSessions(params) {
        const qs = buildQs({
          kioskId: params.kioskId,
          plate: params.plate,
          status: params.status && params.status !== "ALL" ? params.status : undefined,
          fromTs: params.fromTs,
          toTs: params.toTs,
          page: params.page || 1,
          limit: params.limit || 50
        });
        const resp = await api.sessions(qs);
        resp.items = (resp.items || []).map(normalizeSession);
        return resp;
      },

      exportCsvUrl(params) {
        const qs = buildQs({
          kioskId: params.kioskId,
          plate: params.plate,
          status: params.status && params.status !== "ALL" ? params.status : undefined,
          fromTs: params.fromTs,
          toTs: params.toTs
        });
        return api.exportCsv(qs);
      },

      async simulateCarIn(kioskId: string, vehicleType: VehicleType) {
        const r = await api.simulateEntry(kioskId, vehicleType);
        if (r.ok === false) {
          toast.error(r.error || "Không thể xe vào");
          return;
        }
        toast.success("Giả lập: xe vào");
      },

      async simulateCarOut(kioskId: string) {
        const r = await api.simulateExit(kioskId);
        if (r.ok === false) {
          toast.error(r.error || "Không thể xe ra");
          return;
        }
        toast.success("Giả lập: xe ra");
      },

      async simulateTelemetry(kioskId: string) {
        await api.simulateTelemetry(kioskId);
        toast.success("Giả lập: sensor update");
      }
    }),
    [kiosks, sessions, pricing, kpis, toast]
  );

  return <Ctx.Provider value={ctx}>{props.children}</Ctx.Provider>;
}

export function useAppData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppData must be used within AppDataProvider");
  return v;
}
