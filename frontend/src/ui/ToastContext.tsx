import React, { createContext, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";
type Toast = { id: string; type: ToastType; message: string };

type ToastApi = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const Ctx = createContext<ToastApi | null>(null);

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (type: ToastType, message: string) => {
    const id = uid();
    setToasts((prev) => [{ id, type, message }, ...prev]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    []
  );

  return (
    <Ctx.Provider value={api}>
      {children}

      <div className="fixed z-[60] top-4 right-4 flex flex-col gap-2 w-[320px] max-w-[90vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "rounded-xl border shadow-sm px-3 py-2 text-sm " +
              "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 " +
              (t.type === "success"
                ? "text-green-700 dark:text-green-300"
                : t.type === "error"
                ? "text-red-700 dark:text-red-300"
                : "text-gray-800 dark:text-gray-200")
            }
          >
            <div className="font-medium">
              {t.type === "success" ? "Success" : t.type === "error" ? "Error" : "Info"}
            </div>
            <div>{t.message}</div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
