import { AlertTriangle, Car, Banknote } from "lucide-react";
import { Kpis } from "../data/types";

export function KpiCards(props: { kpis: Kpis }) {
  const items = [
    { title: "Tổng xe đang gửi", value: String(props.kpis.activeVehicles), hint: "Sessions đang active", Icon: Car },
    { title: "Doanh thu hôm nay", value: props.kpis.revenueTodayVnd.toLocaleString("vi-VN") + " đ", hint: "Theo ngày", Icon: Banknote },
    { title: "Cảnh báo sensor", value: String(props.kpis.sensorWarnings), hint: "Kiot bất thường", Icon: AlertTriangle }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.title} className="bg-white/90 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{it.title}</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{it.value}</div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{it.hint}</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <it.Icon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
