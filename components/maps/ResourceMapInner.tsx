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
import { categoryIcon, originIcon, liveLocationIcon, CATEGORY_COLORS } from "@/lib/maps/icons";
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
            className={`min-h-9 rounded-full px-3 font-medium transition ${profile === "foot" ? "bg-teal-700 text-white" : ""}`}
            onClick={() => setProfile("foot")}
          >
            Walk path
          </button>
          <button
            type="button"
            className={`min-h-9 rounded-full px-3 font-medium transition ${profile === "driving" ? "bg-teal-700 text-white" : ""}`}
            onClick={() => setProfile("driving")}
          >
            Drive route
          </button>
        </div>
        {selected ? (
          <button
            type="button"
            className="min-h-9 rounded-full border border-sage-200 bg-white px-3 text-sm font-medium hover:bg-sage-100 transition"
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

      <div className={`relative ${heightClass} overflow-hidden rounded-2xl border border-sage-200 shadow-soft`}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
          aria-label="Interactive satellite resource map"
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Google Maps">
              <TileLayer
                attribution="&copy; Google"
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                maxZoom={20}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Google Satellite">
              <TileLayer
                attribution="&copy; Google"
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                maxZoom={20}
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

          {origin?.label === "Your location" || origin?.label === "Using shared location." ? (
            <LiveLocationMarker initialLat={start.lat} initialLng={start.lng} />
          ) : (
            <Marker position={[start.lat, start.lng]} icon={originIcon()}>
              <Popup>
                <strong>{origin?.label ?? "Your start point"}</strong>
                <div className="text-xs">Routes begin here</div>
              </Popup>
            </Marker>
          )}

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
                    className="mt-1 block w-full rounded bg-teal-700 px-2 py-1 text-left text-xs font-semibold text-white transition hover:bg-teal-600"
                    onClick={() => setSelectedId(r.id)}
                  >
                    Show {profile === "foot" ? "walk" : "drive"} path
                  </button>
                  <Link className="block text-teal-700 underline mt-1 text-sm font-medium hover:text-teal-900" href={`/resources/${r.id}`}>
                    Open details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}

          {route ? (
            <>
              {/* Google Maps style route border */}
              <Polyline
                positions={route.coordinates}
                pathOptions={{
                  color: profile === "foot" ? "#1967D2" : "#1967D2",
                  weight: 10,
                  opacity: 0.8,
                  lineJoin: "round",
                  lineCap: "round",
                }}
              />
              {/* Google Maps style route inner */}
              <Polyline
                positions={route.coordinates}
                pathOptions={{
                  color: profile === "foot" ? "#4285F4" : "#4285F4",
                  weight: 6,
                  opacity: 1,
                  lineJoin: "round",
                  lineCap: "round",
                }}
              />
              {route.coordinates.length > 1 ? (
                <CircleMarker
                  center={route.coordinates[Math.floor(route.coordinates.length / 2)]}
                  radius={5}
                  pathOptions={{ color: "#fff", fillColor: "#4285F4", fillOpacity: 1, weight: 2 }}
                />
              ) : null}
            </>
          ) : null}
        </MapContainer>

        {/* Floating Phone UI Card for directions */}
        {route?.steps && route.steps.length > 0 && (
          <div className="absolute top-4 left-4 z-[1000] max-h-[90%] w-80 overflow-y-auto rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-sage-200 pointer-events-auto flex flex-col custom-scrollbar">
            <div className="sticky top-0 bg-teal-700 text-white p-5 shadow-sm z-10 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{formatRouteSummary(route)}</h3>
                <p className="text-xs opacity-90 mt-0.5">{profile === "foot" ? "Walk" : "Drive"} to {selected?.name}</p>
              </div>
              <button 
                onClick={() => { setSelectedId(null); setRoute(null); }} 
                className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 text-xl font-light leading-none transition"
              >
                &times;
              </button>
            </div>
            <ol className="p-5 space-y-4 text-sm text-teal-900 bg-white">
              {route.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-4 border-b border-sage-200 pb-4 last:border-0 last:pb-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-100 text-xs font-semibold text-teal-700 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-[15px]">{step.instruction}</p>
                    {step.distanceMeters > 0 && (
                      <p className="text-xs text-sage-500 mt-1 font-medium">
                        {Math.max(1, Math.round(step.distanceMeters * 3.28084))} ft
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
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
  return CATEGORY_COLORS[category] ?? "#8E8E93";
}

function LiveLocationMarker({ initialLat, initialLng }: { initialLat: number, initialLng: number }) {
  const [pos, setPos] = useState({ lat: initialLat, lng: initialLng });
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    let watchId: number;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (p) => {
          setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
          if (p.coords.heading !== null && !isNaN(p.coords.heading)) {
            setHeading(p.coords.heading);
          }
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const e = event as any;
      if (e.webkitCompassHeading) {
        setHeading(e.webkitCompassHeading);
      } else if (e.alpha !== null) {
        setHeading(360 - e.alpha);
      }
    };

    window.addEventListener("deviceorientationabsolute", handleOrientation);
    window.addEventListener("deviceorientation", handleOrientation as EventListener);

    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
      window.removeEventListener("deviceorientation", handleOrientation as EventListener);
    };
  }, []);

  return (
    <Marker position={[pos.lat, pos.lng]} icon={liveLocationIcon(heading)}>
      <Popup>
        <strong>Your live location</strong>
        <div className="text-xs">Tracking active</div>
      </Popup>
    </Marker>
  );
}
