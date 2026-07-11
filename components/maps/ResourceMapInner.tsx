"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  LayersControl,
  useMap,
} from "react-leaflet";
import Link from "next/link";
import { Car, Footprints, Navigation, X } from "lucide-react";
import type { Resource } from "@/types";
import { CATEGORY_LABELS } from "@/lib/demo/seed";
import { categoryIcon, originIcon, liveLocationIcon, CATEGORY_COLORS } from "@/lib/maps/icons";
import {
  advanceStepIndex,
  formatRouteSummary,
  haversineMeters,
  liveRouteProgress,
  type RouteResult,
} from "@/lib/maps/routing";
import "leaflet/dist/leaflet.css";

type Props = {
  resources: Array<Resource & { distanceMiles?: number }>;
  center?: { lat: number; lng: number };
  origin?: { lat: number; lng: number; label?: string } | null;
  focusId?: string | null;
  heightClass?: string;
  /** Full navigation screen: map only, Google-style summary card in the bottom-left corner. */
  navMode?: boolean;
  onExitNav?: () => void;
  /** When provided, popup "Get directions" hands off to the parent instead of routing inline. */
  onNavigate?: (id: string) => void;
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

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => map.invalidateSize({ animate: false });
    // Re-measure across a few frames so the map fills its container even when it
    // mounts inside a grid/flex column or a section that reveals after layout.
    const timers = [0, 150, 400, 800, 1200].map((ms) => window.setTimeout(invalidate, ms));

    const container = map.getContainer();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(invalidate) : null;
    ro?.observe(container);
    window.addEventListener("resize", invalidate);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      ro?.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, [map]);
  return null;
}

function FollowLivePosition({ pos }: { pos: { lat: number; lng: number } | null }) {
  const map = useMap();
  const lastPan = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!pos) return;
    const prev = lastPan.current;
    // Skip micro-jitter pans so the map feels smooth while walking.
    if (prev && haversineMeters(prev.lat, prev.lng, pos.lat, pos.lng) < 10) return;
    lastPan.current = pos;
    map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.35 });
  }, [map, pos?.lat, pos?.lng, pos]);
  return null;
}

export function ResourceMapInner({
  resources,
  center,
  origin,
  focusId,
  heightClass = "h-[480px]",
  navMode = false,
  onExitNav,
  onNavigate,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(focusId ?? null);
  const [profile, setProfile] = useState<"foot" | "driving">("foot");
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeNote, setRouteNote] = useState("Tap a location icon to draw a path from your start point.");
  const [loadingRoute, setLoadingRoute] = useState(false);
  // Empty set = show every category.
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());

  const mapCenter = center ?? origin ?? (resources[0]
    ? { lat: resources[0].latitude, lng: resources[0].longitude }
    : null);
  const presentCategories = useMemo(() => {
    const present = new Set(resources.map((r) => r.category));
    return Object.keys(CATEGORY_LABELS).filter((k) => present.has(k as Resource["category"]));
  }, [resources]);

  const visibleResources = useMemo(
    () => (activeCats.size === 0 ? resources : resources.filter((r) => activeCats.has(r.category))),
    [resources, activeCats],
  );

  const toggleCat = (key: string) =>
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const selected = useMemo(
    () => resources.find((r) => r.id === selectedId) ?? null,
    [resources, selectedId],
  );

  const start = origin ?? (mapCenter
    ? { lat: mapCenter.lat, lng: mapCenter.lng, label: "Start" }
    : { lat: 0, lng: 0, label: "Start" });

  // --- Live navigation state ---
  const [livePos, setLivePos] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [stepProgress, setStepProgress] = useState(0);
  const [refetchTick, setRefetchTick] = useState(0);
  const [bothRoutes, setBothRoutes] = useState<{ foot: RouteResult | null; driving: RouteResult | null }>({
    foot: null,
    driving: null,
  });
  /** Remaining path + ETA derived from GPS along the real route (updates every fix). */
  const [liveRemaining, setLiveRemaining] = useState<{
    coords: [number, number][];
    meters: number;
    seconds: number;
  } | null>(null);
  const lastRouteStartRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastRefetchAtRef = useRef(0);
  const routeTargetRef = useRef<string | null>(null);
  const livePosRef = useRef(livePos);
  livePosRef.current = livePos;
  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    if (navMode && focusId) setSelectedId(focusId);
    if (!navMode && !focusId) setSelectedId(null);
  }, [focusId, navMode]);

  // Continuous high-accuracy GPS while navigating or a destination is selected.
  useEffect(() => {
    if ((!selected && !navMode) || typeof navigator === "undefined" || !navigator.geolocation) return;

    let bestAccuracy = Infinity;
    const applyFix = (p: GeolocationPosition) => {
      const next = {
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        accuracy: p.coords.accuracy,
      };
      // Ignore very poor fixes once we already have a decent one.
      if (
        typeof next.accuracy === "number" &&
        next.accuracy > 85 &&
        bestAccuracy < 50 &&
        livePosRef.current
      ) {
        return;
      }
      if (typeof next.accuracy === "number") {
        bestAccuracy = Math.min(bestAccuracy, next.accuracy);
      }
      const prev = livePosRef.current;
      // Ignore sub-meter GPS noise so ETA/path updates stay smooth.
      if (prev && haversineMeters(prev.lat, prev.lng, next.lat, next.lng) < 2.5) {
        if (typeof next.accuracy === "number" && next.accuracy < (prev.accuracy ?? Infinity)) {
          setLivePos(next);
        }
        return;
      }
      setLivePos(next);
    };

    // Seed immediately, then keep watching as you move.
    navigator.geolocation.getCurrentPosition(applyFix, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    });
    const id = navigator.geolocation.watchPosition(applyFix, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    });
    return () => navigator.geolocation.clearWatch(id);
  }, [selected, navMode]);

  // Trim path + update minutes as you move; re-request a real route when off-path or far from last origin.
  useEffect(() => {
    if (!livePos || !route?.coordinates?.length) {
      setLiveRemaining(null);
      return;
    }

    const progress = liveRouteProgress(route, livePos);
    setLiveRemaining({
      coords: progress.remainingCoords,
      meters: progress.remainingMeters,
      seconds: progress.remainingSeconds,
    });

    setStepProgress((prev) => advanceStepIndex(route.steps, prev, livePos, 35));

    const lastStart = lastRouteStartRef.current;
    const movedFromStart =
      lastStart != null ? haversineMeters(livePos.lat, livePos.lng, lastStart.lat, lastStart.lng) : 0;
    const offRoute = progress.offRouteMeters;
    const now = Date.now();
    const walking = profileRef.current === "foot";
    const coolDownMs = walking ? 5500 : 8000;
    const moveThreshold = walking ? 35 : 70;
    const offRouteThreshold = walking ? 30 : 55;
    const coolDownOk = now - lastRefetchAtRef.current > coolDownMs;
    // Re-route from live GPS when you've traveled or drifted off the corridor.
    if (coolDownOk && (movedFromStart > moveThreshold || offRoute > offRouteThreshold)) {
      lastRefetchAtRef.current = now;
      setRefetchTick((t) => t + 1);
    }
  }, [livePos, route]);

  const browseOnly = Boolean(onNavigate) && !navMode;
  /** Always use the live GPS navigation card when routing — never a second map UI. */
  const liveNav = navMode || (!browseOnly && Boolean(selected));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selected || browseOnly) {
        setRoute(null);
        setBothRoutes({ foot: null, driving: null });
        setStepProgress(0);
        setLiveRemaining(null);
        return;
      }
      setLoadingRoute(true);
      const from = livePosRef.current ?? { lat: start.lat, lng: start.lng };
      const destChanged = routeTargetRef.current !== selected.id;
      if (destChanged) {
        routeTargetRef.current = selected.id;
        lastRouteStartRef.current = null;
        setStepProgress(0);
        setLiveRemaining(null);
      }
      const isLiveUpdate = !destChanged && lastRouteStartRef.current != null;
      const activeProfile = profileRef.current;

      try {
        if (isLiveUpdate) {
          // Fast re-route of the active mode only — updates ETA + path from where you are now.
          setRouteNote("Updating route from your live location…");
          const params = new URLSearchParams({
            fromLat: String(from.lat),
            fromLng: String(from.lng),
            toLat: String(selected.latitude),
            toLng: String(selected.longitude),
            profile: activeProfile,
          });
          const res = await fetch(`/api/directions?${params.toString()}`);
          const data = (await res.json()) as { route?: RouteResult; error?: string };
          if (cancelled) return;
          if (!res.ok || !data.route) {
            setRouteNote(data.error || "Could not refresh route.");
            setLoadingRoute(false);
            return;
          }
          lastRouteStartRef.current = from;
          setBothRoutes((prev) => ({
            ...prev,
            [activeProfile]: data.route!,
          }));
          setRoute(data.route);
          setStepProgress(0);
          const live = liveRouteProgress(data.route, from);
          setLiveRemaining({
            coords: live.remainingCoords,
            meters: live.remainingMeters,
            seconds: live.remainingSeconds,
          });
          setRouteNote(formatRouteSummary(data.route));
        } else {
          setRouteNote("Calculating real walk and drive times…");
          const params = new URLSearchParams({
            fromLat: String(from.lat),
            fromLng: String(from.lng),
            toLat: String(selected.latitude),
            toLng: String(selected.longitude),
            both: "1",
            profile: activeProfile,
          });
          const res = await fetch(`/api/directions?${params.toString()}`);
          const data = (await res.json()) as {
            foot?: RouteResult;
            driving?: RouteResult;
            active?: RouteResult;
            error?: string;
          };
          if (cancelled) return;
          if (!res.ok || (!data.foot && !data.driving && !data.active)) {
            setRoute(null);
            setBothRoutes({ foot: null, driving: null });
            setRouteNote(data.error || "Could not calculate a real route. Try again.");
            setLoadingRoute(false);
            return;
          }
          const foot = data.foot ?? null;
          const driving = data.driving ?? null;
          const next = (activeProfile === "foot" ? foot : driving) ?? data.active ?? null;
          lastRouteStartRef.current = from;
          lastRefetchAtRef.current = Date.now();
          setBothRoutes({ foot, driving });
          setRoute(next);
          setStepProgress(0);
          if (next) {
            const live = liveRouteProgress(next, from);
            setLiveRemaining({
              coords: live.remainingCoords,
              meters: live.remainingMeters,
              seconds: live.remainingSeconds,
            });
            const walkMin = foot ? Math.max(1, Math.round(foot.durationSeconds / 60)) : null;
            const driveMin = driving ? Math.max(1, Math.round(driving.durationSeconds / 60)) : null;
            setRouteNote(
              [
                walkMin != null ? `Walk ${walkMin} min` : null,
                driveMin != null ? `Drive ${driveMin} min` : null,
                next.provider && next.provider !== "estimate" ? `(${next.provider})` : null,
              ]
                .filter(Boolean)
                .join(" · "),
            );
          }
        }
      } catch {
        if (!cancelled) {
          if (!isLiveUpdate) setRoute(null);
          setRouteNote("Network error calculating route.");
        }
      } finally {
        if (!cancelled) setLoadingRoute(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // livePos omitted on purpose — refetchTick drives live re-routes from livePosRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, start.lat, start.lng, refetchTick, browseOnly]);

  // Instantly show the matching real walk/drive ETA (already calculated — never invent).
  useEffect(() => {
    const next = profile === "foot" ? bothRoutes.foot : bothRoutes.driving;
    if (next) {
      setRoute(next);
      setRouteNote(formatRouteSummary(next));
      const pos = livePosRef.current;
      if (pos) {
        const live = liveRouteProgress(next, pos);
        setLiveRemaining({
          coords: live.remainingCoords,
          meters: live.remainingMeters,
          seconds: live.remainingSeconds,
        });
      }
    }
  }, [profile, bothRoutes]);

  const displayCoords = liveRemaining?.coords ?? route?.coordinates ?? null;
  const displaySeconds = liveRemaining?.seconds ?? route?.durationSeconds ?? null;
  const displayMeters = liveRemaining?.meters ?? route?.distanceMeters ?? null;

  if (!mapCenter) {
    return (
      <div
        className={`flex ${heightClass} items-center justify-center rounded-3xl border border-dashed border-sage-200 bg-white text-sm text-teal-800/80`}
      >
        Share your location to load the map.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!navMode && presentCategories.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCats(new Set())}
            className={`min-h-9 rounded-full border px-3 text-sm font-medium transition ${
              activeCats.size === 0
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-sage-200 bg-white text-teal-900 hover:bg-sage-100"
            }`}
          >
            All
          </button>
          {presentCategories.map((key) => {
            const active = activeCats.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCat(key)}
                aria-pressed={active}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition ${
                  active
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-sage-200 bg-white text-teal-900 hover:bg-sage-100"
                }`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                  style={{ background: categoryColorSafe(key) }}
                  aria-hidden
                />
                {CATEGORY_LABELS[key]}
              </button>
            );
          })}
        </div>
      ) : null}

      {liveNav || browseOnly ? null : (
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
      )}

      <div
        className={`relative ${heightClass} overflow-hidden ${
          liveNav
            ? "rounded-[28px] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.35)]"
            : "rounded-3xl shadow-soft"
        }`}
      >
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
                attribution="Map data &copy; Google"
                url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                subdomains={["0", "1", "2", "3"]}
                maxZoom={20}
                keepBuffer={4}
                updateWhenZooming={false}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Google Satellite">
              <TileLayer
                attribution="Imagery &copy; Google"
                url="https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                subdomains={["0", "1", "2", "3"]}
                maxZoom={20}
                keepBuffer={4}
                updateWhenZooming={false}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <MapReady />
          {liveNav ? null : <FitBounds resources={visibleResources} origin={start} route={route} />}
          {liveNav && livePos ? <FollowLivePosition pos={livePos} /> : null}

          {liveNav || livePos ? (
            <Marker
              position={[livePos?.lat ?? start.lat, livePos?.lng ?? start.lng]}
              icon={liveLocationIcon(null)}
            >
              <Popup>
                <strong>Your live location</strong>
                <div className="text-xs">
                  {livePos
                    ? `GPS active${typeof livePos.accuracy === "number" ? ` · ±${Math.round(livePos.accuracy)}m` : ""}`
                    : "Waiting for GPS…"}
                </div>
              </Popup>
            </Marker>
          ) : (
            <Marker position={[start.lat, start.lng]} icon={originIcon()}>
              <Popup>
                <strong>{origin?.label ?? "Your start point"}</strong>
                <div className="text-xs">Routes begin here</div>
              </Popup>
            </Marker>
          )}

          {visibleResources.map((r) => (
            <Marker
              key={r.id}
              position={[r.latitude, r.longitude]}
              icon={categoryIcon(r.category, r.id === selectedId)}
              eventHandlers={{
                click: () => {
                  if (browseOnly) return;
                  setSelectedId(r.id);
                },
              }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1.5 text-sm">
                  <div className="text-[15px] font-semibold leading-tight">{r.name}</div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-teal-800">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: categoryColorSafe(r.category) }}
                      aria-hidden
                    />
                    {CATEGORY_LABELS[r.category]}
                    {typeof r.distanceMiles === "number" ? ` · ${r.distanceMiles} mi away` : ""}
                  </div>
                  <button
                    type="button"
                    className="mt-1 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-600"
                    onClick={() => (onNavigate ? onNavigate(r.id) : setSelectedId(r.id))}
                  >
                    Get {profile === "foot" ? "walking" : "driving"} directions
                  </button>
                  <Link
                    className="block pt-0.5 text-center text-sm font-medium text-teal-700 underline hover:text-teal-900"
                    href={`/resources/${r.id}`}
                  >
                    Open details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}

          {displayCoords && displayCoords.length > 1 ? (
            <>
              <Polyline
                positions={displayCoords}
                pathOptions={{
                  color: "#1967D2",
                  weight: 10,
                  opacity: 0.8,
                  lineJoin: "round",
                  lineCap: "round",
                }}
              />
              <Polyline
                positions={displayCoords}
                pathOptions={{
                  color: "#4285F4",
                  weight: 6,
                  opacity: 1,
                  lineJoin: "round",
                  lineCap: "round",
                }}
              />
            </>
          ) : null}
        </MapContainer>

        {/* Google Maps-style summary card — always used for live routing */}
        {liveNav ? (
          <div className="pointer-events-auto absolute bottom-4 left-4 z-[1000] w-[calc(100%-2rem)] max-w-[340px] rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
            {route && displaySeconds != null && displayMeters != null ? (
              <>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-semibold text-[#188038]">
                    {displaySeconds < 60 ? "<1" : Math.max(1, Math.round(displaySeconds / 60))} min
                  </span>
                  <span className="text-sm font-medium text-[#5f6368]">
                    {(displayMeters / 1609.34).toFixed(displayMeters < 1609 ? 2 : 1)} mi · arrive{" "}
                    {formatEta(displaySeconds)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-[#3c4043]">
                  {profile === "foot" ? "Walking" : "Driving"} to <strong>{selected?.name}</strong>
                  {loadingRoute ? " · updating…" : livePos ? " · live" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
                  {bothRoutes.foot ? (
                    <button
                      type="button"
                      onClick={() => setProfile("foot")}
                      className={`rounded-full px-2.5 py-1 ${
                        profile === "foot" ? "bg-[#e8f0fe] text-[#1967d2]" : "bg-sage-100 text-[#5f6368]"
                      }`}
                    >
                      Walk{" "}
                      {profile === "foot" && liveRemaining
                        ? liveRemaining.seconds < 60
                          ? "<1"
                          : Math.max(1, Math.round(liveRemaining.seconds / 60))
                        : Math.max(1, Math.round(bothRoutes.foot.durationSeconds / 60))}{" "}
                      min
                    </button>
                  ) : null}
                  {bothRoutes.driving ? (
                    <button
                      type="button"
                      onClick={() => setProfile("driving")}
                      className={`rounded-full px-2.5 py-1 ${
                        profile === "driving" ? "bg-[#e8f0fe] text-[#1967d2]" : "bg-sage-100 text-[#5f6368]"
                      }`}
                    >
                      Drive{" "}
                      {profile === "driving" && liveRemaining
                        ? liveRemaining.seconds < 60
                          ? "<1"
                          : Math.max(1, Math.round(liveRemaining.seconds / 60))
                        : Math.max(1, Math.round(bothRoutes.driving.durationSeconds / 60))}{" "}
                      min
                    </button>
                  ) : null}
                </div>
                {route.steps?.[stepProgress] ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#e8f0fe] px-3 py-2.5">
                    <Navigation className="h-5 w-5 shrink-0 text-[#1a73e8]" aria-hidden />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1967d2]">
                        {route.steps[stepProgress].instruction}
                      </p>
                      {route.steps[stepProgress].distanceMeters > 0 ? (
                        <p className="text-xs text-[#5f6368]">
                          {formatStepDistance(
                            stepProgress === 0 && liveRemaining
                              ? Math.min(route.steps[stepProgress].distanceMeters, liveRemaining.meters)
                              : route.steps[stepProgress].distanceMeters,
                          )}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {livePos ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#188038]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#188038] opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#188038]" />
                    </span>
                    Live GPS — path & ETA update as you move
                    {typeof livePos.accuracy === "number" ? ` · ±${Math.round(livePos.accuracy)}m` : ""}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-[#5f6368]">Waiting for GPS for live tracking…</p>
                )}
              </>
            ) : (
              <p className="text-sm font-medium text-[#5f6368]">
                {loadingRoute ? "Calculating real walk and drive times…" : "Finding the best route…"}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <div className="inline-flex rounded-full border border-[#dadce0] p-0.5">
                <button
                  type="button"
                  aria-label="Walking"
                  aria-pressed={profile === "foot"}
                  onClick={() => setProfile("foot")}
                  className={`flex h-9 w-11 items-center justify-center rounded-full transition ${
                    profile === "foot" ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#5f6368] hover:bg-sage-100"
                  }`}
                >
                  <Footprints className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Driving"
                  aria-pressed={profile === "driving"}
                  onClick={() => setProfile("driving")}
                  className={`flex h-9 w-11 items-center justify-center rounded-full transition ${
                    profile === "driving" ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#5f6368] hover:bg-sage-100"
                  }`}
                >
                  <Car className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onExitNav) onExitNav();
                  else {
                    setSelectedId(null);
                    setRoute(null);
                    setBothRoutes({ foot: null, driving: null });
                  }
                }}
                className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#d93025] px-5 text-sm font-semibold text-white transition hover:bg-[#b3261e]"
              >
                <X className="h-4 w-4" aria-hidden />
                End
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {liveNav ? null : (
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
      )}

    </div>
  );
}

function formatEta(durationSeconds: number) {
  const eta = new Date(Date.now() + durationSeconds * 1000);
  return eta.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function categoryColorSafe(category: string) {
  return CATEGORY_COLORS[category] ?? "#8E8E93";
}

function formatStepDistance(meters: number) {
  const feet = meters * 3.28084;
  if (feet < 1000) return `${Math.max(10, Math.round(feet / 10) * 10)} ft`;
  return `${(feet / 5280).toFixed(1)} mi`;
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
