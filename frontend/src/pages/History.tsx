import { useEffect, useMemo, useState } from "react";
import { useAppData } from "../data/AppDataContext";
import { HistoryFilters, HistoryFilterState } from "../components/HistoryFilters";
import { HistoryTable } from "../components/HistoryTable";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "../ui/ToastContext";

function toStartOfDayISO(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toISOString();
}
function toEndOfDayISO(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T23:59:59");
  return d.toISOString();
}

export default function History() {
  const toast = useToast();
  const { kiosks, fetchSessions, exportCsvUrl } = useAppData();

  const [filter, setFilter] = useState<HistoryFilterState>({
    qPlate: "",
    kioskId: "ALL",
    status: "ALL",
    from: "",
    to: ""
  });

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const loading = useState(false);
  const [isLoading, setIsLoading] = loading;

  const kioskNameOf = (id: string) => kiosks.find((k) => k.id === id)?.name ?? id;

  const backendStatus = useMemo(() => {
    if (filter.status === "IN") return "ACTIVE";
    if (filter.status === "OUT") return "DONE";
    return "ALL";
  }, [filter.status]);

  async function load(p: number) {
    setIsLoading(true);
    try {
      const resp = await fetchSessions({
        kioskId: filter.kioskId,
        plate: filter.qPlate,
        status: backendStatus as any,
        fromTs: filter.from ? toStartOfDayISO(filter.from) : "",
        toTs: filter.to ? toEndOfDayISO(filter.to) : "",
        page: p,
        limit
      });
      setRows(resp.items);
      setTotal(resp.total);
      setPage(resp.page);
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setIsLoading(false);
    }
  }

  // reload on filter change
  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.kioskId, filter.status, filter.from, filter.to, filter.qPlate]);

  const csvHref = exportCsvUrl({
    kioskId: filter.kioskId,
    plate: filter.qPlate,
    status: backendStatus as any,
    fromTs: filter.from ? toStartOfDayISO(filter.from) : "",
    toTs: filter.to ? toEndOfDayISO(filter.to) : ""
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Lịch sử</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Lọc theo thời gian / kiot / trạng thái, export CSV</div>
        </div>

        <a
          href={csvHref}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <HistoryFilters kiosks={kiosks} value={filter} onChange={(n) => setFilter(n)} />

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {isLoading ? "Đang tải..." : `Tổng: ${total.toLocaleString("vi-VN")} bản ghi`}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            onClick={() => load(Math.max(1, page - 1))}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </button>
          <div className="text-sm text-gray-700 dark:text-gray-200">
            Trang {page}/{totalPages}
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            onClick={() => load(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <HistoryTable rows={rows as any} kioskNameOf={kioskNameOf} />
    </div>
  );
}
