import { useState } from "react";
import { useAppData } from "../data/AppDataContext";
import { KioskStatusStrip } from "../components/KioskStatusStrip";
import { KioskCard } from "../components/KioskCard";
import { VehicleType } from "../data/types";
import { KioskDetailModal } from "../components/KioskDetailModal";
import { KpiCards } from "../components/KpiCards";

export default function Dashboard() {
  const { kiosks, sessions, kpis, simulateCarIn, simulateCarOut, simulateTelemetry } = useAppData();
const [detailKioskId, setDetailKioskId] = useState<string | null>(null);

  const activeOf = (kioskId: string) => sessions.find((s) => s.kioskId === kioskId && !s.exitAt);
  const detailKiosk = kiosks.find((k) => k.id === detailKioskId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Theo dõi kiot, camera, xe vào/ra và cảm biến (realtime)
          </div>
        </div>
      </div>

      <KpiCards kpis={kpis} />
      <KioskStatusStrip kiosks={kiosks} sessions={sessions} />

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        {kiosks.map((k) => (
          <KioskCard
            key={k.id}
            kiosk={k}
            activeSession={activeOf(k.id)}
            onCarIn={(plate: string, vt: VehicleType) => simulateCarIn(k.id, plate, vt)}
            onCarOut={() => simulateCarOut(k.id)}
            onOpenDetail={() => setDetailKioskId(k.id)}
          />
        ))}
      </div>

      <KioskDetailModal open={!!detailKioskId} kiosk={detailKiosk} sessions={sessions} onClose={() => setDetailKioskId(null)} />
    </div>
  );
}
