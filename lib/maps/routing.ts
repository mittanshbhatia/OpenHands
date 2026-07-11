export type LatLng = { lat: number; lng: number };

export type RouteStep = {
  instruction: string;
  distanceMeters: number;
  /** Maneuver point as [lat, lng], used for live progress tracking. */
  location?: [number, number];
};

export type RouteResult = {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  profile: "foot" | "driving";
  steps?: RouteStep[];
  /** Where the ETA came from — never invent times without a source. */
  provider?: "google" | "osrm" | "estimate";
};

/** Fetch a walking or driving path via public OSRM demo (no API key). */
export async function fetchOsrmRoute(
  from: LatLng,
  to: LatLng,
  profile: "foot" | "driving" = "foot",
): Promise<RouteResult | null> {
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: Array<{
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
        legs?: Array<{
          steps?: Array<{
            distance: number;
            name: string;
            maneuver: { type: string; modifier?: string; location?: [number, number] };
          }>;
        }>;
      }>;
    };
    const route = data.routes?.[0];
    if (!route?.geometry?.coordinates?.length) return null;
    
    const steps: RouteStep[] = [];
    if (route.legs?.[0]?.steps) {
      for (const step of route.legs[0].steps) {
        const maneuver = step.maneuver;
        const name = step.name ? ` onto ${step.name}` : "";
        
        let action = maneuver.type;
        if (action === "depart") action = "Head";
        else if (action === "turn") action = "Turn";
        else if (action === "arrive") action = "Arrive";
        else if (action === "continue") action = "Continue";
        else action = action.charAt(0).toUpperCase() + action.slice(1);
        
        let modifier = maneuver.modifier ? ` ${maneuver.modifier.replace(/-/g, ' ')}` : "";
        if (action === "Arrive") modifier = "";
        
        let instruction = `${action}${modifier}${name}`;
        
        steps.push({
          instruction: instruction.trim().replace(/\s+/g, ' '),
          distanceMeters: step.distance,
          location: maneuver.location ? [maneuver.location[1], maneuver.location[0]] : undefined,
        });
      }
    }

    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      profile,
      steps,
    };
  } catch {
    return null;
  }
}

export function formatRouteSummary(route: RouteResult) {
  const miles = (route.distanceMeters / 1609.34).toFixed(1);
  const mins = Math.max(1, Math.round(route.durationSeconds / 60));
  const mode = route.profile === "foot" ? "Walk" : "Drive";
  return `${mode} · ${miles} mi · ~${mins} min`;
}

/** Closest vertex index on a lat/lng polyline to a live position. */
export function closestPointIndex(coords: [number, number][], pos: LatLng): number {
  if (!coords.length) return 0;
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = haversineMeters(pos.lat, pos.lng, coords[i][0], coords[i][1]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/**
 * Project live GPS onto the nearest polyline segment (more accurate than vertex-only).
 * Returns the along-route index to keep, the snapped point, and distance off the path.
 */
export function projectOntoRoute(
  coords: [number, number][],
  pos: LatLng,
): {
  /** First vertex index still ahead (exclusive of traveled portion). */
  aheadIndex: number;
  snapped: [number, number];
  offRouteMeters: number;
  /** Meters from snapped point to destination along the polyline. */
  remainingAlongMeters: number;
} {
  if (!coords.length) {
    return {
      aheadIndex: 0,
      snapped: [pos.lat, pos.lng],
      offRouteMeters: Infinity,
      remainingAlongMeters: 0,
    };
  }
  if (coords.length === 1) {
    const only = coords[0];
    return {
      aheadIndex: 0,
      snapped: only,
      offRouteMeters: haversineMeters(pos.lat, pos.lng, only[0], only[1]),
      remainingAlongMeters: 0,
    };
  }

  let bestDist = Infinity;
  let bestSnap: [number, number] = coords[0];
  let bestSeg = 0;
  let bestT = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    const ax = a[1];
    const ay = a[0];
    const bx = b[1];
    const by = b[0];
    const px = pos.lng;
    const py = pos.lat;
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    const t = ab2 <= 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const sx = ax + abx * t;
    const sy = ay + aby * t;
    const d = haversineMeters(pos.lat, pos.lng, sy, sx);
    if (d < bestDist) {
      bestDist = d;
      bestSnap = [sy, sx];
      bestSeg = i;
      bestT = t;
    }
  }

  // Remaining = leftover of current segment + all later segments.
  const b = coords[bestSeg + 1];
  const remainingCurrent = haversineMeters(bestSnap[0], bestSnap[1], b[0], b[1]);
  const remainingTail = pathLengthMeters(coords, bestSeg + 1);
  // If projection is very near the end of a segment, advance past it.
  const aheadIndex = bestT > 0.98 ? bestSeg + 1 : bestSeg + 1;

  return {
    aheadIndex: Math.min(aheadIndex, coords.length - 1),
    snapped: bestSnap,
    offRouteMeters: bestDist,
    remainingAlongMeters: Math.max(0, remainingCurrent + remainingTail),
  };
}

/** Path length along polyline from index `from` to the end. */
export function pathLengthMeters(coords: [number, number][], from = 0): number {
  let sum = 0;
  for (let i = Math.max(0, from); i < coords.length - 1; i++) {
    sum += haversineMeters(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
  }
  return sum;
}

/** Typical speeds (m/s) used to convert remaining meters → live ETA. */
export function profileSpeedMps(profile: "foot" | "driving"): number {
  return profile === "foot" ? 1.35 : 11.5;
}

/**
 * Live progress along a real route: remaining geometry, meters, and ETA.
 * Updates instantly from GPS along the last real route (no network wait).
 */
export function liveRouteProgress(
  route: RouteResult,
  pos: LatLng,
): {
  remainingCoords: [number, number][];
  remainingMeters: number;
  remainingSeconds: number;
  offRouteMeters: number;
  closestIndex: number;
} {
  const coords = route.coordinates;
  if (!coords.length) {
    return {
      remainingCoords: [],
      remainingMeters: route.distanceMeters,
      remainingSeconds: route.durationSeconds,
      offRouteMeters: Infinity,
      closestIndex: 0,
    };
  }

  const projected = projectOntoRoute(coords, pos);
  const hop = Math.min(projected.offRouteMeters, 40);
  const remainingMeters = Math.max(0, projected.remainingAlongMeters + hop);

  // Prefer geometry × profile speed; blend with server duration so ETA stays realistic.
  const speed = profileSpeedMps(route.profile);
  const fromSpeed = remainingMeters / Math.max(speed, 0.3);
  const baseline = Math.max(route.distanceMeters, 1);
  const fromServer = route.durationSeconds * Math.min(1, remainingMeters / baseline);
  const remainingSeconds = Math.max(0, Math.round(fromSpeed * 0.55 + fromServer * 0.45));

  const remainingCoords: [number, number][] = [
    [pos.lat, pos.lng],
    projected.snapped,
    ...coords.slice(projected.aheadIndex),
  ];
  // Deduplicate nearly-identical consecutive points.
  const cleaned: [number, number][] = [];
  for (const c of remainingCoords) {
    const prev = cleaned[cleaned.length - 1];
    if (!prev || haversineMeters(prev[0], prev[1], c[0], c[1]) > 1) cleaned.push(c);
  }
  if (cleaned.length < 2) {
    cleaned.push(coords[coords.length - 1] ?? [pos.lat, pos.lng]);
  }

  return {
    remainingCoords: cleaned,
    remainingMeters,
    remainingSeconds,
    offRouteMeters: projected.offRouteMeters,
    closestIndex: projected.aheadIndex,
  };
}

/** Advance turn index when the user is near the *next* maneuver (not the current start). */
export function advanceStepIndex(
  steps: RouteStep[] | undefined,
  current: number,
  pos: LatLng,
  thresholdMeters = 40,
): number {
  if (!steps?.length) return 0;
  let p = Math.max(0, Math.min(current, steps.length - 1));
  while (p < steps.length - 1) {
    const next = steps[p + 1]?.location;
    if (!next) break;
    if (haversineMeters(pos.lat, pos.lng, next[0], next[1]) <= thresholdMeters) p += 1;
    else break;
  }
  return p;
}

/** Straight-line fallback when OSRM is unavailable. */
export function straightLineRoute(from: LatLng, to: LatLng, profile: "foot" | "driving"): RouteResult {
  const distanceMeters =
    haversineMeters(from.lat, from.lng, to.lat, to.lng) * (profile === "foot" ? 1.2 : 1.35);
  return {
    coordinates: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
    distanceMeters,
    durationSeconds: distanceMeters / (profile === "foot" ? 1.4 : 11),
    profile,
    steps: [
      {
        instruction: `Head ${compassDirection(from, to)} toward your destination`,
        distanceMeters,
        location: [from.lat, from.lng],
      },
      { instruction: "Arrive at your destination", distanceMeters: 0, location: [to.lat, to.lng] },
    ],
  };
}

function compassDirection(from: LatLng, to: LatLng) {
  const dLat = to.lat - from.lat;
  const dLng = to.lng - from.lng;
  const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  const dirs = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  return dirs[Math.round(((angle + 360) % 360) / 45) % 8];
}

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
