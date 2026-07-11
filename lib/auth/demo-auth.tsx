"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { DemoUser, UserRole } from "@/types";
import { demoUsers } from "@/lib/demo/seed";

type AuthState = {
  user: DemoUser | null;
  role: UserRole;
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);
const KEY = "openhands.demo.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw) as DemoUser);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      role: user?.role ?? "guest",
      signIn: (email, password) => {
        const found = demoUsers.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
        );
        if (!found) return { ok: false, error: "No demo account matched those credentials." };
        setUser(found);
        localStorage.setItem(KEY, JSON.stringify(found));
        return { ok: true };
      },
      signOut: () => {
        setUser(null);
        localStorage.removeItem(KEY);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
