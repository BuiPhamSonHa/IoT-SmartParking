import { useMemo, useState } from "react";
import { Kiosk, ParkingSession, VehicleType } from "../data/types";
import { CameraFeed } from "./CameraFeed";
import { Droplet, Info, LogIn, LogOut, Thermometer } from "lucide-react";

function fmt(iso?: string) {
  if (!iso) return "--";
  return new Date(iso).toLocaleString();
}

function duration(entryISO?: string, exitISO?: string) {
  if (!entryISO) return "--";
  const a = new Date(entryISO).getTime();
  const b = exitISO ? new Date(exitISO).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((b - a) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const vtLabel: Record<VehicleType, string> = {
  MOTORBIKE: "Xe máy",
  CAR: "Ô tô",
  TRUCK: "Xe tải"
};

type Level = "LOW" | "NORMAL" | "HIGH";

function tempLevel(t: number): Level {
  if (t >= 38) return "HIGH";
  if (t <= 18) return "LOW";
  return "NORMAL";
}
function humLevel(h: number): Level {
  if (h >= 85) return "HIGH";
  if (h <= 30) return "LOW";
  return "NORMAL";
}

function tempLabel(level: Level) {
  if (level === "HIGH") return "Nhiệt độ: Quá cao";
  if (level === "LOW") return "Nhiệt độ: Thấp";
  return "Nhiệt độ: Bình thường";
}
function humLabel(level: Level) {
  if (level === "HIGH") return "Độ ẩm: Cao";
  if (level === "LOW") return "Độ ẩm: Thấp";
  return "Độ ẩm: Bình thường";
}

function chipClass(kind: "temp" | "hum", level: Level) {
  if (kind === "temp") {
    if (level === "HIGH")
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800";
    if (level === "LOW")
      return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800";
    return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800";
  }

  // humidity
  if (level === "HIGH")
    return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800";
  if (level === "LOW")
    return "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800";
  return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800";
}

function statusBadge(st: "FULL" | "TRỐNG") {
  if (st === "FULL") {
    return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800";
  }
  return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800";
}

export function KioskCard(props: {
  kiosk: Kiosk;
  activeSession?: ParkingSession;
  onCarIn: (plate: string, vt: VehicleType) => void;
  onCarOut: () => void;
  onOpenDetail: () => void;
}) {
  const { kiosk, activeSession } = props;
  const status: "FULL" | "TRỐNG" = activeSession ? "FULL" : "TRỐNG";

  const [plate, setPlate] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("CAR");

  const canIn = useMemo(() => status === "TRỐNG", [status]);

  const tLv = tempLevel(kiosk.temperatureC);
  const hLv = humLevel(kiosk.humidityPct);

  return (
    <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-gray-900 dark:text-gray-100 text-lg truncate">{kiosk.name}</div>
            <div className={"text-xs px-2 py-1 rounded-xl border font-semibold " + statusBadge(status)}>{status}</div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className={"inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-semibold " + chipClass("temp", tLv)}>
              <Thermometer className="h-4 w-4" />
              {kiosk.temperatureC}°C
            </div>
            <div className={"inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-semibold " + chipClass("hum", hLv)}>
              <Droplet className="h-4 w-4" />
              {kiosk.humidityPct}%
            </div>
          </div>
        </div>

        <button
          className="shrink-0 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800
                     bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition inline-flex items-center gap-2"
          onClick={props.onOpenDetail}
        >
          <Info className="h-4 w-4" />
          Chi tiết
        </button>
      </div>

      {/* Body */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(420px,640px)_minmax(0,1fr)] gap-4 items-start">
        {/* Camera */}
        <div className="space-y-3 min-w-0">
          <CameraFeed
            seed={kiosk.id}
            srcOverride={kiosk.cameraImageUrl || undefined}
            className="w-full max-w-full aspect-video min-h-[220px] sm:min-h-[260px] md:min-h-[300px] xl:min-h-0"
            overlayLeft={<span>Camera • {kiosk.name}</span>}
            overlayRight={
              <div className="flex gap-2">
                <div className={"inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-xl border font-semibold bg-black/45 text-white border-white/20"}>
                  <Thermometer className="h-4 w-4" />
                  {tempLabel(tLv).replace("Nhiệt độ: ", "")}
                </div>
                <div className={"inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-xl border font-semibold bg-black/45 text-white border-white/20"}>
                  <Droplet className="h-4 w-4" />
                  {humLabel(hLv).replace("Độ ẩm: ", "")}
                </div>
              </div>
            }
          />

          {/* Sensor detail chips */}
          <div className="grid grid-cols-2 gap-2">
            <div className={"rounded-2xl border px-3 py-2 " + chipClass("temp", tLv)}>
              <div className="text-xs font-semibold">{tempLabel(tLv)}</div>
              <div className="mt-0.5 text-sm font-extrabold">{kiosk.temperatureC}°C</div>
            </div>
            <div className={"rounded-2xl border px-3 py-2 " + chipClass("hum", hLv)}>
              <div className="text-xs font-semibold">{humLabel(hLv)}</div>
              <div className="mt-0.5 text-sm font-extrabold">{kiosk.humidityPct}%</div>
            </div>
          </div>
        </div>

        {/* Info + controls */}
        <div className="space-y-3 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
              <div className="text-xs text-gray-600 dark:text-gray-300">Biển số</div>
              <div className="font-extrabold text-gray-900 dark:text-gray-100 truncate">{activeSession?.plate ?? "—"}</div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
              <div className="text-xs text-gray-600 dark:text-gray-300">Loại xe</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {activeSession ? vtLabel[activeSession.vehicleType] : "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
              <div className="text-xs text-gray-600 dark:text-gray-300">Thời lượng</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {duration(activeSession?.entryAt, activeSession?.exitAt)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
              <div className="text-xs text-gray-600 dark:text-gray-300">Giờ vào</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{fmt(activeSession?.entryAt)}</div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
              <div className="text-xs text-gray-600 dark:text-gray-300">Giờ ra</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{fmt(activeSession?.exitAt)}</div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3 py-2">
              <div className="text-xs text-gray-600 dark:text-gray-300">Giá (VND)</div>
              <div className="font-extrabold text-gray-900 dark:text-gray-100">
                {(activeSession?.priceVnd ?? 0).toLocaleString("vi-VN")}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Thao tác</div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_auto] gap-2 min-w-0">
              <input
                className="border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full min-w-0 sm:col-span-2 lg:col-span-1"
                placeholder="Nhập biển số (bỏ trống = random)"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                disabled={!canIn}
              />

              <select
                className="border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full min-w-0 sm:col-span-2 lg:col-span-1"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                disabled={!canIn}
              >
                <option value="MOTORBIKE">Xe máy</option>
                <option value="CAR">Ô tô</option>
                <option value="TRUCK">Xe tải</option>
              </select>

              {status === "TRỐNG" ? (
                <button
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow-sm
                             hover:bg-emerald-700 active:scale-[0.99] transition inline-flex items-center justify-center gap-2 w-full lg:w-auto"
                  onClick={() => {
                    props.onCarIn(plate, vehicleType);
                    setPlate("");
                  }}
                >
                  <LogIn className="h-4 w-4" />
                  Xe vào
                </button>
              ) : (
                <button
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold shadow-sm
                             hover:bg-red-700 active:scale-[0.99] transition inline-flex items-center justify-center gap-2 w-full lg:w-auto"
                  onClick={props.onCarOut}
                >
                  <LogOut className="h-4 w-4" />
                  Xe ra (tính tiền)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
