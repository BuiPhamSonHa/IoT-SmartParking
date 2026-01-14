import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Clock } from "../components/Clock";
import { useAuth } from "../auth/AuthContext";
import { ThemeToggle } from "../components/ThemeToggle";

const navClass = ({ isActive }: { isActive: boolean }) =>
  "block rounded-xl px-3 py-2 text-sm font-medium transition " +
  (isActive
    ? "bg-indigo-600 text-white shadow-sm"
    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800");

const topNavClass = ({ isActive }: { isActive: boolean }) =>
  "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition border " +
  (isActive
    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
    : "bg-white/60 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-900");

export function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [loc.pathname]);

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-800 rounded-2xl p-2 shadow-sm">
      <NavLink to="/" className={navClass} end onClick={onNavigate}>
        Dashboard
      </NavLink>
      <NavLink to="/history" className={navClass} onClick={onNavigate}>
        Lịch sử
      </NavLink>
      <NavLink to="/settings" className={navClass} onClick={onNavigate}>
        Cài đặt
      </NavLink>
    </div>
  );

  return (
    <div className="min-h-dvh overflow-x-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Topbar */}
      <div className="h-16 bg-white/85 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <button
            className="sm:hidden px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800
                       text-gray-800 dark:text-gray-200 bg-white/70 dark:bg-gray-900/60 hover:bg-white"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold">
              P
            </div>
            <div>
              <div className="font-semibold leading-5 text-gray-900 dark:text-gray-100">SmartPark Admin</div>
              <div className="text-xs text-gray-600 dark:text-gray-300 -mt-0.5">Parking kiosk dashboard</div>
            </div>

          {/* Top navigation (desktop/tablet) */}
          <nav className="hidden sm:flex items-center gap-2 ml-3 min-w-0 overflow-x-auto no-scrollbar">
            <NavLink to="/" className={topNavClass} end>
              Dashboard
            </NavLink>
            <NavLink to="/history" className={topNavClass}>
              Lịch sử
            </NavLink>
            <NavLink to="/settings" className={topNavClass}>
              Cài đặt
            </NavLink>
          </nav>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock />
          <ThemeToggle />
          <div className="hidden sm:block text-sm text-gray-700 dark:text-gray-200">{user?.username}</div>
          <button
            className="text-sm px-3 py-2 rounded-xl bg-indigo-600 text-white font-medium shadow-sm
                       hover:bg-indigo-700 active:scale-[0.99] transition"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex min-w-0">
        {/* Sidebar mobile drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setSidebarOpen(false);
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative h-full w-80 max-w-[90vw] bg-gray-50 dark:bg-gray-950 p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-gray-900 dark:text-gray-100">Menu</div>
                <button
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800
                             text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900"
                  onClick={() => setSidebarOpen(false)}
                >
                  ✕
                </button>
              </div>
              <SidebarContent onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}