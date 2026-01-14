import { useState } from "react";
import { useAppData } from "../data/AppDataContext";
import { VehicleType } from "../data/types";

const vtLabel: Record<VehicleType, string> = {
  MOTORBIKE: "Xe máy",
  CAR: "Ô tô",
  TRUCK: "Xe tải"
};

export default function Settings() {
  const { kiosks, addKiosk, renameKiosk, deleteKiosk, pricing, updatePricing, setRate } = useAppData();
  const [newName, setNewName] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Cài đặt</div>
        <div className="text-sm text-gray-600 dark:text-gray-300">Quản lý kiot và cấu hình giá</div>
      </div>

      <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="font-semibold text-gray-900 dark:text-gray-100">Quản lý kiot</div>

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            placeholder="Tên kiot mới (VD: Kiot 4)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-sm
                       hover:bg-indigo-700 active:scale-[0.99] transition"
            onClick={() => {
              if (!newName.trim()) return;
              addKiosk(newName.trim());
              setNewName("");
            }}
          >
            + Thêm kiot
          </button>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
              <tr className="text-left text-gray-700 dark:text-gray-200">
                <th className="p-3">ID</th>
                <th className="p-3">Tên kiot</th>
                <th className="p-3">Nhiệt độ</th>
                <th className="p-3">Độ ẩm</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {kiosks.map((k) => (
                <tr key={k.id} className="border-b border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200">
                  <td className="p-3">{k.id}</td>
                  <td className="p-3">
                    <input
                      className="border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      defaultValue={k.name}
                      onBlur={(e) => renameKiosk(k.id, e.target.value)}
                    />
                  </td>
                  <td className="p-3">{k.temperatureC}°C</td>
                  <td className="p-3">{k.humidityPct}%</td>
                  <td className="p-3">
                    <button
                      className="px-3 py-1 rounded-xl bg-red-600 text-white text-sm font-semibold
                                 hover:bg-red-700 transition"
                      onClick={() => deleteKiosk(k.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="font-semibold text-gray-900 dark:text-gray-100">Bảng giá</div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {(["MOTORBIKE", "CAR", "TRUCK"] as VehicleType[]).map((vt) => (
            <div key={vt} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-3 bg-white dark:bg-gray-900">
              <div className="font-semibold text-gray-900 dark:text-gray-100">{vtLabel[vt]}</div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded-xl border border-gray-200 dark:border-gray-800
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  onClick={() => setRate(vt, pricing.ratePerHour[vt] - 1000)}
                >
                  -
                </button>
                <input
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={pricing.ratePerHour[vt]}
                  onChange={(e) => setRate(vt, Number(e.target.value || 0))}
                />
                <button
                  className="px-3 py-1 rounded-xl border border-gray-200 dark:border-gray-800
                             bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  onClick={() => setRate(vt, pricing.ratePerHour[vt] + 1000)}
                >
                  +
                </button>
              </div>
              <div className="mt-1 text-gray-600 dark:text-gray-300">VND / giờ</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-3 bg-white dark:bg-gray-900">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Miễn phí phút đầu</div>
            <input
              className="mt-2 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              type="number"
              value={pricing.freeMinutes}
              onChange={(e) => updatePricing({ freeMinutes: Number(e.target.value || 0) })}
            />
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-3 bg-white dark:bg-gray-900">
            <div className="font-semibold text-gray-900 dark:text-gray-100">Làm tròn tiền (VND)</div>
            <input
              className="mt-2 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              type="number"
              value={pricing.roundingVnd}
              onChange={(e) => updatePricing({ roundingVnd: Number(e.target.value || 1) })}
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Tip: Tính tiền theo giờ, làm tròn theo bội số rounding, miễn phí freeMinutes phút đầu.
        </div>
      </div>
    </div>
  );
}
