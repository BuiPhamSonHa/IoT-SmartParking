export type HistoryFilterState = {
  qPlate: string;
  kioskId: string;
  status: "ALL" | "IN" | "OUT";
  from: string; // yyyy-mm-dd
  to: string;   // yyyy-mm-dd
};

export function HistoryFilters(props: {
  kiosks: { id: string; name: string }[];
  value: HistoryFilterState;
  onChange: (next: HistoryFilterState) => void;
}) {
  const v = props.value;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
      <div className="font-semibold text-gray-900 dark:text-gray-100">Bộ lọc</div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
        <div>
          <label className="text-gray-600 dark:text-gray-300">Từ ngày</label>
          <input
            className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            type="date"
            value={v.from}
            onChange={(e) => props.onChange({ ...v, from: e.target.value })}
          />
        </div>

        <div>
          <label className="text-gray-600 dark:text-gray-300">Đến ngày</label>
          <input
            className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            type="date"
            value={v.to}
            onChange={(e) => props.onChange({ ...v, to: e.target.value })}
          />
        </div>

        <div>
          <label className="text-gray-600 dark:text-gray-300">Kiot</label>
          <select
            className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            value={v.kioskId}
            onChange={(e) => props.onChange({ ...v, kioskId: e.target.value })}
          >
            <option value="ALL">Tất cả</option>
            {props.kiosks.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-600 dark:text-gray-300">Trạng thái</label>
          <select
            className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            value={v.status}
            onChange={(e) => props.onChange({ ...v, status: e.target.value as any })}
          >
            <option value="ALL">Tất cả</option>
            <option value="IN">Đang gửi</option>
            <option value="OUT">Đã ra</option>
          </select>
        </div>

        <div>
          <label className="text-gray-600 dark:text-gray-300">Biển số</label>
          <input
            className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            placeholder="VD: 30A-123.45"
            value={v.qPlate}
            onChange={(e) => props.onChange({ ...v, qPlate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
