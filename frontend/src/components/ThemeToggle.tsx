import { useEffect, useState } from "react";

const LS_KEY = "smartpark:theme"; // "light" | "dark"

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = (localStorage.getItem(LS_KEY) as "light" | "dark" | null) ?? "light";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(LS_KEY, next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="text-sm px-3 py-1 rounded-lg border
                 bg-white dark:bg-gray-800
                 text-gray-700 dark:text-gray-200
                 border-gray-200 dark:border-gray-700"
      title="Toggle theme"
    >
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
