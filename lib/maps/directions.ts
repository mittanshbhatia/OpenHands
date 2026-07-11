import type { LatLng, RouteResult, RouteStep } from "@/lib/maps/routing";

function getGoogleKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ""
  );
}

type GoogleLeg = {
  distance?: { value?: number; text?: string };
  duration?: { value?: number; text?: string };
  steps?: Array<{
    html_instructions?: string;
    distance?: { value?: number };
    start_location?: { lat: number; lng: number };
    end_location?: { lat: number; lng: number };
  }>;
};

type GoogleDirectionsResponse = {
  status: string;
  routes?: Array<{
    overview_polyline?: { points?: string };
    legs?: GoogleLeg[];
  }>;
  error_message?: string;
};

/** Decode Google encoded polyline → [lat, lng][]. */
function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

function stripHtml(html: string) {
  return html
    .replace(/<div[^>]*>/gi, ". ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Real walking or driving route from Google Directions API.
 * Walking and driving use different modes → different paths and ETAs.
 */
export async function fetchGoogleDirections(
  from: LatLng,
  to: LatLng,
  profile: "foot" | "driving",
): Promise<RouteResult | null> {
  const key = getGoogleKey();
  if (!key) return null;

  const mode = profile === "foot" ? "walking" : "driving";
  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${from.lat},${from.lng}` +
    `&destination=${to.lat},${to.lng}` +
    `&mode=${mode}` +
    `&units=imperial` +
    `&key=${key}`;

  for (let i = 0; i < 3; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.status === 429 || res.status >= 500) {
        await sleep(400 * (i + 1));
        continue;
      }
      if (!res.ok) return null;
      const data = (await res.json()) as GoogleDirectionsResponse;
      if (data.status === "OVER_QUERY_LIMIT" || data.status === "UNKNOWN_ERROR") {
        await sleep(500 * (i + 1));
        continue;
      }
      if (data.status !== "OK" || !data.routes?.[0]) return null;

      const route = data.routes[0];
      const leg = route.legs?.[0];
      if (!leg?.distance?.value || !leg.duration?.value) return null;

      const poly = route.overview_polyline?.points;
      const coordinates = poly
        ? decodePolyline(poly)
        : ([
            [from.lat, from.lng],
            [to.lat, to.lng],
          ] as [number, number][]);

      const steps: RouteStep[] = (leg.steps ?? []).map((s) => ({
        instruction: stripHtml(s.html_instructions || "Continue"),
        distanceMeters: s.distance?.value ?? 0,
        location: s.start_location ? [s.start_location.lat, s.start_location.lng] : undefined,
      }));
      if (steps.length && leg.steps?.at(-1)?.end_location) {
        const end = leg.steps[leg.steps.length - 1].end_location!;
        steps.push({
          instruction: "Arrive at your destination",
          distanceMeters: 0,
          location: [end.lat, end.lng],
        });
      }

      return {
        coordinates,
        distanceMeters: leg.distance.value,
        durationSeconds: leg.duration.value,
        profile,
        steps,
        provider: "google",
      };
    } catch {
      await sleep(400 * (i + 1));
    }
  }
  return null;
}

/** Prefer Google Directions (real walk vs drive); fall back to OSRM. Never invent ETAs. */
export async function fetchRealRoute(
  from: LatLng,
  to: LatLng,
  profile: "foot" | "driving",
): Promise<RouteResult | null> {
  const google = await fetchGoogleDirections(from, to, profile);
  if (google) return google;

  const { fetchOsrmRoute } = await import("@/lib/maps/routing");
  const osrm = await fetchOsrmRoute(from, to, profile);
  if (osrm) return { ...osrm, provider: "osrm" };

  return null;
}

export async function fetchBothProfiles(from: LatLng, to: LatLng) {
  const [foot, driving] = await Promise.all([
    fetchRealRoute(from, to, "foot"),
    fetchRealRoute(from, to, "driving"),
  ]);
  if (!foot && !driving) {
    throw new Error("Could not get a real walk or drive route. Try again in a moment.");
  }
  return { foot, driving };
}
