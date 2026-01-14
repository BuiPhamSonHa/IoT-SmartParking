export function Modal(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!props.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-5xl max-h-[calc(100dvh-2rem)] rounded-2xl bg-white dark:bg-gray-900
                      border border-gray-200 dark:border-gray-800 shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="font-semibold text-gray-900 dark:text-gray-100">{props.title}</div>
          <button
            className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-800
                       text-gray-700 dark:text-gray-200"
            onClick={props.onClose}
          >
            Đóng
          </button>
        </div>
        <div className="p-4 overflow-y-auto min-h-0">{props.children}</div>
      </div>
    </div>
  );
}
