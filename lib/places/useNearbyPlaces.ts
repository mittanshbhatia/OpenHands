"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Resource, ResourceCategory } from "@/types";
import { filterResourcesByCategories } from "@/lib/places/category-match";

type PlacesState = {
  resources: Array<Resource & { distanceMiles?: number }>;
  loading: boolean;
  error: string | null;
  source: string | null;
  warning: string | null;
};

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function friendlyError(raw?: string) {
  if (!raw) return "Could not load places. Tap Retry.";
  if (/fetch failed|network|abort|timeout/i.test(raw)) {
    return "Temporary connection issue. Retrying loads real Google Places near you.";
  }
  return raw;
}

export function useNearbyPlaces(
  origin: { lat: number; lng: number } | null,
  categories: ResourceCategory[] | Set<ResourceCategory>,
  maxMiles = 25,
) {
  const cats = Array.isArray(categories) ? categories : [...categories];
  const catKey = cats.slice().sort().join(",");
  const [state, setState] = useState<PlacesState>({
    resources: [],
    loading: false,
    error: null,
    source: null,
    warning: null,
  });
  const gen = useRef(0);

  const reload = useCallback(async () => {
    if (!origin || cats.length === 0) {
      setState({ resources: [], loading: false, error: null, source: null, warning: null });
      return;
    }

    const myGen = ++gen.current;
    setState((s) => ({ ...s, loading: true, error: null, warning: null }));

    const params = new URLSearchParams({
      lat: String(origin.lat),
      lng: String(origin.lng),
      categories: catKey,
      maxMiles: String(maxMiles),
    });

    let lastError: string | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 45000);
        const res = await fetch(`/api/places?${params.toString()}`, { signal: controller.signal });
        window.clearTimeout(timeout);
        const data = (await res.json()) as {
          resources?: Array<Resource & { distanceMiles?: number }>;
          error?: string;
          source?: string;
          warning?: string;
        };

        if (myGen !== gen.current) return;

        // Strict client filter: never show a category the user did not select.
        const scoped = filterResourcesByCategories(data.resources ?? [], cats);

        if (res.ok && scoped.length > 0) {
          setState({
            resources: scoped,
            loading: false,
            error: null,
            source: data.source ?? "google_places",
            warning: data.warning ?? null,
          });
          return;
        }

        if (res.ok && attempt < 3) {
          lastError = data.warning || data.error || "No places yet";
          await sleep(500 * (attempt + 1));
          continue;
        }

        if (res.ok) {
          setState({
            resources: [],
            loading: false,
            error: null,
            source: data.source ?? "google_places",
            warning: data.warning || "No places found in range for your selected needs.",
          });
          return;
        }

        lastError = friendlyError(data.error);
        await sleep(600 * (attempt + 1));
      } catch (err) {
        lastError = friendlyError(err instanceof Error ? err.message : "fetch failed");
        await sleep(700 * (attempt + 1));
      }
    }

    if (myGen !== gen.current) return;
    setState({
      resources: [],
      loading: false,
      error: friendlyError(lastError || undefined),
      source: null,
      warning: null,
    });
  }, [origin?.lat, origin?.lng, catKey, maxMiles, cats.length, origin]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}
