import React, { createContext, useContext, useMemo, useState } from "react";

type AuthCtx = {
  isAuthed: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  user: { username: string } | null;
};

const Ctx = createContext<AuthCtx | null>(null);
const LS_KEY = "smartpark:auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ username: string } | null>(() => {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const login = (username: string, password: string) => {
    if (username === "admin" && password === "123456") {
      const u = { username };
      setUser(u);
      localStorage.setItem(LS_KEY, JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LS_KEY);
  };

  const value = useMemo(() => ({ isAuthed: !!user, login, logout, user }), [user]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
