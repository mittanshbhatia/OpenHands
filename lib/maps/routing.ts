export type LatLng = { lat: number; lng: number };

export type RouteStep = {
  instruction: string;
  distanceMeters: number;
};

export type RouteResult = {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  profile: "foot" | "driving";
  steps?: RouteStep[];
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
    const res = await fetch(url);
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
            maneuver: { type: string; modifier?: string };
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
          distanceMeters: step.distance
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
  };
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
