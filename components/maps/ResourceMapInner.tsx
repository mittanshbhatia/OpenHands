"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  LayersControl,
  CircleMarker,
  useMap,
} from "react-leaflet";
import Link from "next/link";
import type { Resource } from "@/types";
import { CATEGORY_LABELS } from "@/lib/demo/seed";
import { categoryIcon, originIcon } from "@/lib/maps/icons";
import {
  fetchOsrmRoute,
  formatRouteSummary,
  straightLineRoute,
  type RouteResult,
} from "@/lib/maps/routing";
import "leaflet/dist/leaflet.css";

type Props = {
  resources: Array<Resource & { distanceMiles?: number }>;
  center?: { lat: number; lng: number };
  origin?: { lat: number; lng: number; label?: string } | null;
  focusId?: string | null;
  heightClass?: string;
};

function FitBounds({
  resources,
  origin,
  route,
}: {
  resources: Props["resources"];
  origin?: Props["origin"];
  route: RouteResult | null;
}) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = resources.map((r) => [r.latitude, r.longitude]);
    if (origin) pts.push([origin.lat, origin.lng]);
    if (route?.coordinates?.length) pts.push(...route.coordinates);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 14);
      return;
    }
    map.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
  }, [map, resources, origin, route]);
  return null;
}

export function ResourceMapInner({
  resources,
  center,
  origin,
  focusId,
  heightClass = "h-[480px]",
}: Props) {
  const mapCenter = center ?? origin ?? { lat: 37.7749, lng: -122.4194 };
  const [selectedId, setSelectedId] = useState<string | null>(focusId ?? null);
  const [profile, setProfile] = useState<"foot" | "driving">("foot");
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeNote, setRouteNote] = useState("Tap a location icon to draw a path from your start point.");
  const [loadingRoute, setLoadingRoute] = useState(false);

  const selected = useMemo(
    () => resources.find((r) => r.id === selectedId) ?? null,
    [resources, selectedId],
  );

  const start = origin ?? { lat: mapCenter.lat, lng: mapCenter.lng, label: "Start" };

  useEffect(() => {
    if (focusId) setSelectedId(focusId);
  }, [focusId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selected) {
        setRoute(null);
        return;
      }
      setLoadingRoute(true);
      setRouteNote("Building path…");
      const dest = { lat: selected.latitude, lng: selected.longitude };
      const live = await fetchOsrmRoute(start, dest, profile);
      if (cancelled) return;
      const next = live ?? straightLineRoute(start, dest, profile);
      setRoute(next);
      setRouteNote(
        live
          ? formatRouteSummary(next)
          : `${formatRouteSummary(next)} (approximate line — live routing unavailable)`,
      );
      setLoadingRoute(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [selected, profile, start.lat, start.lng]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-sage-200 bg-white p-1 text-sm">
          <button
            type="button"
            className={`min-h-9 rounded-full px-3 font-medium ${profile === "foot" ? "bg-teal-700 text-white" : ""}`}
            onClick={() => setProfile("foot")}
          >
            Walk path
          </button>
          <button
            type="button"
            className={`min-h-9 rounded-full px-3 font-medium ${profile === "driving" ? "bg-teal-700 text-white" : ""}`}
            onClick={() => setProfile("driving")}
          >
            Drive route
          </button>
        </div>
        {selected ? (
          <button
            type="button"
            className="min-h-9 rounded-full border border-sage-200 bg-white px-3 text-sm font-medium"
            onClick={() => {
              setSelectedId(null);
              setRoute(null);
              setRouteNote("Tap a location icon to draw a path from your start point.");
            }}
          >
            Clear route
          </button>
        ) : null}
        <p className="text-sm text-teal-800/80" role="status">
          {loadingRoute ? "Building path…" : routeNote}
        </p>
      </div>

      <div className={`${heightClass} overflow-hidden rounded-2xl border border-sage-200 shadow-soft`}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
          aria-label="Interactive satellite resource map"
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite">
              <TileLayer
                attribution='Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Streets">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.Overlay checked name="Place labels">
              <TileLayer
                attribution="Labels &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
                opacity={0.95}
              />
            </LayersControl.Overlay>
          </LayersControl>

          <FitBounds resources={resources} origin={start} route={route} />

          <Marker position={[start.lat, start.lng]} icon={originIcon()}>
            <Popup>
              <strong>{origin?.label ?? "Your start point"}</strong>
              <div className="text-xs">Routes begin here</div>
            </Popup>
          </Marker>

          {resources.map((r) => (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={categoryIcon(r.category, r.id === selectedId)}
              eventHandlers={{
                click: () => setSelectedId(r.id),
              }}
            >
              <Popup>
                <div className="min-w-[160px] space-y-1 text-sm">
                  <div className="font-semibold">{r.name}</div>
                  <div>{CATEGORY_LABELS[r.category]}</div>
                  {typeof r.distanceMiles === "number" ? (
                    <div className="text-xs">{r.distanceMiles} mi away</div>
                  ) : null}
                  <button
                    type="button"
                    className="mt-1 block w-full rounded bg-teal-700 px-2 py-1 text-left text-xs font-semibold text-white"
                    onClick={() => setSelectedId(r.id)}
                  >
                    Show {profile === "foot" ? "walk" : "drive"} path
                  </button>
                  <Link className="block text-teal-700 underline" href={`/resources/${r.id}`}>
                    Open details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}

          {route ? (
            <>
              <Polyline
                positions={route.coordinates}
                pathOptions={{
                  color: profile === "foot" ? "#e56b45" : "#124f3b",
                  weight: 5,
                  opacity: 0.9,
                  lineJoin: "round",
                  lineCap: "round",
                }}
              />
              {route.coordinates.length > 1 ? (
                <CircleMarker
                  center={route.coordinates[Math.floor(route.coordinates.length / 2)]}
                  radius={4}
                  pathOptions={{ color: "#fff", fillColor: "#e56b45", fillOpacity: 1 }}
                />
              ) : null}
            </>
          ) : null}
        </MapContainer>
      </div>

      <ul className="flex flex-wrap gap-2 text-xs text-teal-800/80">
        {Object.entries(CATEGORY_LABELS)
          .slice(0, 6)
          .map(([key, label]) => (
            <li key={key} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 border border-sage-200">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: categoryColorSafe(key) }}
                aria-hidden
              />
              {label}
            </li>
          ))}
        <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 border border-sage-200">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-coral-500" aria-hidden />
          Start point
        </li>
      </ul>
    </div>
  );
}

function categoryColorSafe(category: string) {
  const map: Record<string, string> = {
    food: "#cf5230",
    shelter: "#124f3b",
    clothing: "#1f7a5c",
    hygiene: "#3b82a0",
    medical: "#b45309",
    employment: "#5b6b8a",
  };
  return map[category] ?? "#124f3b";
}
