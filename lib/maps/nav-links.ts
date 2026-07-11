import type { Resource } from "@/types";

export type StoredOrigin = { lat: number; lng: number; label?: string };

export function readLastOrigin(): StoredOrigin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("openhands.lastOrigin");
    if (!raw) return null;
    const o = JSON.parse(raw) as StoredOrigin;
    if (!Number.isFinite(o.lat) || !Number.isFinite(o.lng)) return null;
    return o;
  } catch {
    return null;
  }
}

/**
 * Same live navigation screen used from listings:
 * /explore?...&nav=<placeId>
 */
export function exploreNavigateHref(
  resource: Resource,
  origin?: StoredOrigin | null,
): string {
  const o = origin ?? readLastOrigin();
  if (!o) {
    // No origin yet — send home; after location, user can reopen from Saved.
    return `/?needLocation=1&nav=${encodeURIComponent(resource.id)}`;
  }
  const params = new URLSearchParams({
    lat: String(o.lat),
    lng: String(o.lng),
    label: o.label ?? "Your location",
    nav: resource.id,
  });
  return `/explore?${params.toString()}`;
}

export function exploreChooseHref(origin: StoredOrigin): string {
  const params = new URLSearchParams({
    lat: String(origin.lat),
    lng: String(origin.lng),
    label: origin.label ?? "Your location",
  });
  return `/explore?${params.toString()}`;
}

export function exploreResultsHref(origin: StoredOrigin, categories: string[]): string {
  const params = new URLSearchParams({
    lat: String(origin.lat),
    lng: String(origin.lng),
    label: origin.label ?? "Your location",
  });
  if (categories.length) params.set("cats", categories.join(","));
  return `/explore?${params.toString()}`;
}
