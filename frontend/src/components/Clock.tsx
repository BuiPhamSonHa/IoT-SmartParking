import { useEffect, useState } from "react";

export function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-sm text-gray-600 dark:text-gray-300">
      {now.toLocaleTimeString()} — {now.toLocaleDateString()}
    </div>
  );
}
