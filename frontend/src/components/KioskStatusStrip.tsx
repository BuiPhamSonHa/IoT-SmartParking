import { Kiosk, ParkingSession } from "../data/types";

function statusOf(sessions: ParkingSession[], kioskId: string) {
  const active = sessions.find((s) => s.kioskId === kioskId && !s.exitAt);
  return active ? "FULL" : "TRỐNG";
}

function badgeClass(st: "FULL" | "TRỐNG") {
  if (st === "FULL") {
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800";
  }
  return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800";
}

function dotClass(st: "FULL" | "TRỐNG") {
  return st === "FULL" ? "bg-red-500" : "bg-emerald-500";
}

export function KioskStatusStrip({ kiosks, sessions }: { kiosks: Kiosk[]; sessions: ParkingSession[] }) {
  const fullCount = kiosks.filter((k) => statusOf(sessions, k.id) === "FULL").length;
  const emptyCount = kiosks.length - fullCount;

  return (
    <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">Tổng quan trạng thái</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            FULL: <b>{fullCount}</b> • TRỐNG: <b>{emptyCount}</b> • Tổng: <b>{kiosks.length}</b>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kiosks.map((k) => {
          const st = statusOf(sessions, k.id);
          return (
            <div
              key={k.id}
              className="border border-gray-200 dark:border-gray-800 rounded-2xl p-3 bg-white dark:bg-gray-900 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{k.name}</div>
                <div className={"text-xs px-2 py-1 rounded-xl border font-semibold " + badgeClass(st as any)}>
                  {st}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className={"inline-block h-2.5 w-2.5 rounded-full " + dotClass(st as any)} />
                {st === "FULL" ? "Đang có xe" : "Sẵn sàng nhận xe"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
