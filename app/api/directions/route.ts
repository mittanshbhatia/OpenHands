import { NextResponse } from "next/server";
import { fetchBothProfiles, fetchRealRoute } from "@/lib/maps/directions";

/**
 * Real walk + drive ETAs from Google Directions (preferred) or OSRM.
 * Never invents times — returns provider field for transparency.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromLat = Number(searchParams.get("fromLat"));
  const fromLng = Number(searchParams.get("fromLng"));
  const toLat = Number(searchParams.get("toLat"));
  const toLng = Number(searchParams.get("toLng"));
  const profile = searchParams.get("profile") === "driving" ? "driving" : "foot";
  const both = searchParams.get("both") === "1";

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return NextResponse.json({ error: "fromLat, fromLng, toLat, toLng required" }, { status: 400 });
  }

  const from = { lat: fromLat, lng: fromLng };
  const to = { lat: toLat, lng: toLng };

  try {
    if (both) {
      const routes = await fetchBothProfiles(from, to);
      return NextResponse.json({
        foot: routes.foot,
        driving: routes.driving,
        active: routes[profile] ?? routes.foot ?? routes.driving ?? null,
      });
    }
    const route = await fetchRealRoute(from, to, profile);
    if (!route) {
      return NextResponse.json(
        { error: "No real walk/drive route available right now. Try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({ route });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Routing failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
