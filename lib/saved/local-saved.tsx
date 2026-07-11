"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Resource } from "@/types";

export type SavedLocation = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  source: "typed" | "gps";
  at: string;
};

export type ChatSummary = {
  id: string;
  summary: string;
  topics: string[];
  messageCount: number;
  at: string;
};

export type DirectionEntry = {
  id: string;
  resource: Resource;
  at: string;
};

export type HostLocation = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  capacity: string;
  at: string;
};

type SavedState = {
  ids: string[];
  planIds: string[];
  byId: Record<string, Resource>;
  directions: DirectionEntry[];
  locations: SavedLocation[];
  chatSummaries: ChatSummary[];
  hostLocations: HostLocation[];
  syncing: boolean;
  toggleSave: (resource: Resource) => void;
  addToPlan: (resource: Resource) => void;
  removeFromPlan: (id: string) => void;
  clearPlan: () => void;
  recordDirection: (resource: Resource) => void;
  recordLocation: (loc: Omit<SavedLocation, "id" | "at"> & { id?: string; at?: string }) => void;
  recordChatSummary: (summary: Omit<ChatSummary, "id" | "at"> & { id?: string; at?: string }) => void;
  addHostLocation: (host: Omit<HostLocation, "id" | "at">) => void;
  clearDirections: () => void;
  clearLocations: () => void;
  clearChatSummaries: () => void;
};

const SavedContext = createContext<SavedState | null>(null);

const LS = {
  saved: "openhands.saved",
  plan: "openhands.plan",
  cache: "openhands.saved.cache",
  directions: "openhands.directions",
  locations: "openhands.locations",
  chats: "openhands.chatSummaries",
  hosts: "openhands.hostLocations",
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [planIds, setPlanIds] = useState<string[]>([]);
  const [byId, setById] = useState<Record<string, Resource>>({});
  const [directions, setDirections] = useState<DirectionEntry[]>([]);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [hostLocations, setHostLocations] = useState<HostLocation[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(readJson(LS.saved, [] as string[]));
    setPlanIds(readJson(LS.plan, [] as string[]));
    setById(readJson(LS.cache, {} as Record<string, Resource>));
    setDirections(readJson(LS.directions, [] as DirectionEntry[]));
    setLocations(readJson(LS.locations, [] as SavedLocation[]));
    setChatSummaries(readJson(LS.chats, [] as ChatSummary[]));
    setHostLocations(readJson(LS.hosts, [] as HostLocation[]));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS.saved, JSON.stringify(ids));
  }, [ids, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS.plan, JSON.stringify(planIds));
  }, [planIds, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS.cache, JSON.stringify(byId));
  }, [byId, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS.directions, JSON.stringify(directions.slice(0, 100)));
  }, [directions, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS.locations, JSON.stringify(locations.slice(0, 100)));
  }, [locations, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS.chats, JSON.stringify(chatSummaries.slice(0, 100)));
  }, [chatSummaries, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS.hosts, JSON.stringify(hostLocations.slice(0, 50)));
  }, [hostLocations, hydrated]);

  const toggleSave = useCallback((resource: Resource) => {
    setById((prev) => ({ ...prev, [resource.id]: resource }));
    setIds((prev) =>
      prev.includes(resource.id) ? prev.filter((x) => x !== resource.id) : [...prev, resource.id],
    );
  }, []);

  const addToPlan = useCallback((resource: Resource) => {
    setById((prev) => ({ ...prev, [resource.id]: resource }));
    setPlanIds((prev) => (prev.includes(resource.id) ? prev : [...prev, resource.id]));
  }, []);

  const removeFromPlan = useCallback((id: string) => {
    setPlanIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const clearPlan = useCallback(() => setPlanIds([]), []);

  const recordDirection = useCallback((resource: Resource) => {
    const entry: DirectionEntry = { id: uid(), resource, at: new Date().toISOString() };
    setById((prev) => ({ ...prev, [resource.id]: resource }));
    setDirections((prev) => [entry, ...prev.filter((d) => d.resource.id !== resource.id)].slice(0, 100));
  }, []);

  const recordLocation = useCallback(
    (loc: Omit<SavedLocation, "id" | "at"> & { id?: string; at?: string }) => {
      const entry: SavedLocation = {
        id: loc.id ?? uid(),
        label: loc.label,
        lat: loc.lat,
        lng: loc.lng,
        source: loc.source,
        at: loc.at ?? new Date().toISOString(),
      };
      setLocations((prev) => {
        const dup = prev.find(
          (p) =>
            Math.abs(p.lat - entry.lat) < 0.0001 &&
            Math.abs(p.lng - entry.lng) < 0.0001 &&
            Date.now() - new Date(p.at).getTime() < 60_000,
        );
        if (dup) return prev;
        return [entry, ...prev].slice(0, 100);
      });
    },
    [],
  );

  const recordChatSummary = useCallback(
    (summary: Omit<ChatSummary, "id" | "at"> & { id?: string; at?: string }) => {
      if (!summary.summary.trim()) return;
      const entry: ChatSummary = {
        id: summary.id ?? uid(),
        summary: summary.summary.trim(),
        topics: summary.topics ?? [],
        messageCount: summary.messageCount ?? 0,
        at: summary.at ?? new Date().toISOString(),
      };
      setChatSummaries((prev) => [entry, ...prev].slice(0, 100));
    },
    [],
  );

  const addHostLocation = useCallback((host: Omit<HostLocation, "id" | "at">) => {
    const entry: HostLocation = { ...host, id: uid(), at: new Date().toISOString() };
    setHostLocations((prev) => [entry, ...prev].slice(0, 50));
  }, []);

  const value = useMemo<SavedState>(
    () => ({
      ids,
      planIds,
      byId,
      directions,
      locations,
      chatSummaries,
      hostLocations,
      syncing: false,
      toggleSave,
      addToPlan,
      removeFromPlan,
      clearPlan,
      recordDirection,
      recordLocation,
      recordChatSummary,
      addHostLocation,
      clearDirections: () => setDirections([]),
      clearLocations: () => setLocations([]),
      clearChatSummaries: () => setChatSummaries([]),
    }),
    [
      ids,
      planIds,
      byId,
      directions,
      locations,
      chatSummaries,
      hostLocations,
      toggleSave,
      addToPlan,
      removeFromPlan,
      clearPlan,
      recordDirection,
      recordLocation,
      recordChatSummary,
      addHostLocation,
    ],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}

export function summarizeChatThread(
  messages: Array<{ role: string; content: string }>,
): { summary: string; topics: string[]; messageCount: number } | null {
  const users = messages.filter((m) => m.role === "user").map((m) => m.content.trim()).filter(Boolean);
  if (!users.length) return null;
  const assistant = messages.filter((m) => m.role === "assistant").map((m) => m.content.trim());
  const lastHelp = assistant.at(-1)?.replace(/\s+/g, " ").slice(0, 180) ?? "";
  const asked = users.map((u) => u.slice(0, 80)).join(" → ");
  const topics: string[] = [];
  const blob = `${asked} ${lastHelp}`.toLowerCase();
  for (const [key, re] of [
    ["food", /(food|meal|eat|hungry|pantry)/],
    ["shelter", /(shelter|bed|sleep|tonight)/],
    ["clothing", /(cloth|coat|jacket)/],
    ["hygiene", /(shower|hygiene)/],
    ["medical", /(medical|clinic|doctor)/],
    ["give help", /(give help|donat)/],
    ["directions", /(direction|navigate|route)/],
  ] as const) {
    if (re.test(blob)) topics.push(key);
  }
  return {
    summary: lastHelp
      ? `You asked about “${asked}”. Assistant: ${lastHelp}${lastHelp.length >= 180 ? "…" : ""}`
      : `You asked about “${asked}”.`,
    topics,
    messageCount: messages.length,
  };
}
