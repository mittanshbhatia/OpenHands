"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type SavedState = {
  ids: string[];
  planIds: string[];
  toggleSave: (id: string) => void;
  addToPlan: (id: string) => void;
  removeFromPlan: (id: string) => void;
  clearPlan: () => void;
};

const SavedContext = createContext<SavedState | null>(null);
const SAVE_KEY = "openhands.saved";
const PLAN_KEY = "openhands.plan";

export function SavedProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [planIds, setPlanIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setIds(JSON.parse(localStorage.getItem(SAVE_KEY) || "[]") as string[]);
      setPlanIds(JSON.parse(localStorage.getItem(PLAN_KEY) || "[]") as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(ids));
  }, [ids]);
  useEffect(() => {
    localStorage.setItem(PLAN_KEY, JSON.stringify(planIds));
  }, [planIds]);

  const value = useMemo<SavedState>(
    () => ({
      ids,
      planIds,
      toggleSave: (id) =>
        setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      addToPlan: (id) => setPlanIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
      removeFromPlan: (id) => setPlanIds((prev) => prev.filter((x) => x !== id)),
      clearPlan: () => setPlanIds([]),
    }),
    [ids, planIds],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}
