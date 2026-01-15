import { useEffect, useMemo, useState } from "react";
import { Kiosk, ParkingSession, VehicleType } from "../data/types";
import { Modal } from "./Modal";
import { useAppData } from "../data/AppDataContext";
import { useToast } from "../ui/ToastContext";

const vtLabel: Record<VehicleType, string> = {
  MOTORBIKE: "Xe máy",
  CAR: "Ô tô",
  TRUCK: "Xe tải"
};

function fmt(iso?: string | null) {
  if (!iso) return "--";
  return new Date(iso).toLocaleString();
}

function statusBadge(st: "FULL" | "TRỐNG") {
  if (st === "FULL") return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800";
  return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800";
}

export function KioskDetailModal(props: {
  open: boolean;
  kiosk: Kiosk | null;
  sessions: ParkingSession[]; // recent from dashboard (for active)
  onClose: () => void;
}) {
  const toast = useToast();
  const { fetchSessions } = useAppData();
  const kiosk = props.kiosk;

  const active = useMemo(() => {
    if (!kiosk) return undefined;
    return props.sessions.find((s) => s.kioskId === kiosk.id && !s.exitAt);
  }, [kiosk, props.sessions]);

  const status: "FULL" | "TRỐNG" = active ? "FULL" : "TRỐNG";

  const [rows, setRows] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!props.open || !kiosk) return;
    setLoading(true);
    fetchSessions({ kioskId: kiosk.id, page: 1, limit: 30 })
      .then((r) => setRows(r.items))
      .catch((e: any) => toast.error(String(e?.message || e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, kiosk?.id]);

  if (!kiosk) return null;

  return (
    <Modal open={props.open} title={`Chi tiết — ${kiosk.name}`} onClose={props.onClose}>
      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-4 min-w-0">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Camera</div>
            <div className={"text-xs px-2 py-1 rounded-xl border font-semibold " + statusBadge(status)}>{status}</div>
          </div>

          <div className="p-3">
            <div
              className="w-full aspect-video min-h-[300px] sm:min-h-[360px] rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden"
            >
              {active?.cameraImageDataUrl ? (
                <img src={active.cameraImageDataUrl} alt="camera" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  No snapshot yet
                </div>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
                <div className="px-2 py-1 text-[11px] text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">Plate (entry/exit)</div>
                {(active?.exitPlateImageDataUrl || active?.entryPlateImageDataUrl) ? (
                  <img
                    src={active?.exitPlateImageDataUrl || active?.entryPlateImageDataUrl || undefined}
                    alt="plate"
                    className="w-full h-28 object-cover"
                  />
                ) : (
                  <div className="h-28 flex items-center justify-center text-[11px] text-gray-500 dark:text-gray-400">--</div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
                <div className="px-2 py-1 text-[11px] text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">Camera (entry)</div>
                {active?.cameraImageDataUrl ? (
                  <img src={active.cameraImageDataUrl} alt="camera" className="w-full h-28 object-cover" />
                ) : (
                  <div className="h-28 flex items-center justify-center text-[11px] text-gray-500 dark:text-gray-400">--</div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 text-sm text-gray-700 dark:text-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">Biển số</div>
              <div className="font-semibold">{active?.plate || kiosk.currentPlate || "--"}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">Loại xe</div>
              <div className="font-semibold">
                {active?.vehicleType ? vtLabel[active.vehicleType] : kiosk.currentVehicleType ? vtLabel[kiosk.currentVehicleType] : "--"}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">Giờ vào</div>
              <div className="font-semibold">{fmt(active?.entryAt || kiosk.currentEntryAt || null)}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">Sensor</div>
              <div className="font-semibold">
                {kiosk.envStatus === "DANGER" ? "Nguy hiểm" : kiosk.envStatus === "WARN" ? "Cảnh báo" : "Bình thường"} •{" "}
                {kiosk.temperatureC.toFixed(1)}°C • {kiosk.humidityPct.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Lịch sử riêng của kiot</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">30 bản ghi gần nhất</div>
          </div>

          <div className="overflow-auto max-h-[520px]">
            <table className="min-w-[680px] w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                <tr className="text-left text-gray-700 dark:text-gray-200">
                  <th className="p-3">Vào</th>
                  <th className="p-3">Ra</th>
                  <th className="p-3">Biển số</th>
                  <th className="p-3">Loại</th>
                  <th className="p-3">Giá</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="p-4 text-gray-600 dark:text-gray-300" colSpan={5}>
                      Đang tải...
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200">
                      <td className="p-3">{fmt(r.entryAt)}</td>
                      <td className="p-3">{fmt(r.exitAt || null)}</td>
                      <td className="p-3 font-medium">{r.plate}</td>
                      <td className="p-3">{vtLabel[r.vehicleType]}</td>
                      <td className="p-3">{(r.priceVnd ?? r.feeVnd ?? 0).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-600 dark:text-gray-300" colSpan={5}>
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
