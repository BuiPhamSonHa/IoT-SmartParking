import { ParkingSession, VehicleType } from "../data/types";

const vtLabel: Record<VehicleType, string> = {
  MOTORBIKE: "Xe máy",
  CAR: "Ô tô",
  TRUCK: "Xe tải"
};

function fmt(iso?: string) {
  if (!iso) return "--";
  return new Date(iso).toLocaleString();
}

export function HistoryTable(props: { rows: ParkingSession[]; kioskNameOf: (id: string) => string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 font-semibold border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100">
        Lịch sử
      </div>

      <div className="overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
            <tr className="text-left text-gray-700 dark:text-gray-200">
              <th className="p-3">Vào</th>
              <th className="p-3">Ra</th>
              <th className="p-3">Biển số</th>
              <th className="p-3">Loại xe</th>
              <th className="p-3">Kiot</th>
              <th className="p-3">Giá (VND)</th>
              <th className="p-3">Ảnh</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200">
                <td className="p-3">{fmt(r.entryAt)}</td>
                <td className="p-3">{fmt(r.exitAt)}</td>
                <td className="p-3 font-medium">{r.plate}</td>
                <td className="p-3">{vtLabel[r.vehicleType]}</td>
                <td className="p-3">{props.kioskNameOf(r.kioskId)}</td>
                <td className="p-3">{(r.priceVnd ?? r.feeVnd ?? 0).toLocaleString("vi-VN")}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {r.cameraImageDataUrl ? (
                      <img
                        src={r.cameraImageDataUrl}
                        alt="camera"
                        className="h-12 w-20 rounded-lg object-cover border border-gray-200 dark:border-gray-800"
                      />
                    ) : (
                      <div className="h-12 w-20 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center">--</div>
                    )}
                    {(r.exitPlateImageDataUrl || r.entryPlateImageDataUrl) ? (
                      <img
                        src={r.exitPlateImageDataUrl || r.entryPlateImageDataUrl || undefined}
                        alt="plate"
                        className="h-12 w-20 rounded-lg object-cover border border-gray-200 dark:border-gray-800"
                      />
                    ) : (
                      <div className="h-12 w-20 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-center">--</div>
                    )}
                  </div>
                </td>
                <td className="p-3">{r.exitAt ? "Đã ra" : "Đang gửi"}</td>
              </tr>
            ))}
            {props.rows.length === 0 && (
              <tr>
                <td className="p-4 text-gray-600 dark:text-gray-300" colSpan={8}>
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
