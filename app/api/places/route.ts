import { NextResponse } from "next/server";
import { getGooglePlaceById, markClosestRecommended, searchGooglePlaces } from "@/lib/places/google";
import { filterResourcesByCategories } from "@/lib/places/category-match";
import { haversineMiles } from "@/lib/matching/geo";
import type { Resource, ResourceCategory } from "@/types";

const ALL_CATEGORIES: ResourceCategory[] = [
  "food",
  "shelter",
  "clothing",
  "hygiene",
  "medical",
  "employment",
  "transportation",
  "legal",
  "internet",
  "donation",
];

function getApiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ""
  );
}

/** Run category searches with limited concurrency to avoid Google rate limits. */
async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const placeId = searchParams.get("placeId");
  const categoryParam = searchParams.get("categories") || searchParams.get("category") || "";
  const maxMiles = Number(searchParams.get("maxMiles") || "25");

  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing Google Places API key. Add GOOGLE_PLACES_API_KEY to .env.local (Places API New enabled).",
        resources: [],
      },
      { status: 503 },
    );
  }

  if (placeId) {
    const cat = (categoryParam.split(",")[0] || "shelter") as ResourceCategory;
    const one = await getGooglePlaceById(apiKey, placeId, cat);
    if (!one) {
      return NextResponse.json({ resources: [], warning: "Place detail temporarily unavailable. Retry." });
    }
    const withDist =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? {
            ...one,
            distanceMiles: Number(haversineMiles(lat, lng, one.latitude, one.longitude).toFixed(1)),
          }
        : one;
    return NextResponse.json({ resources: [withDist] });
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required", resources: [] }, { status: 400 });
  }

  const categories = categoryParam
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is ResourceCategory => ALL_CATEGORIES.includes(c as ResourceCategory));

  // Never invent a category mix — empty selection means no listings.
  if (!categories.length) {
    return NextResponse.json({
      resources: [],
      source: "google_places",
      warning: "Pick at least one need (food, shelter, …) to search.",
    });
  }

  const targets = categories;
  const radiusMeters = Math.min(50000, Math.max(5000, (Number.isFinite(maxMiles) ? maxMiles : 25) * 1609.34));

  try {
    const batches = await mapPool(targets, 2, async (category) => {
      try {
        return await searchGooglePlaces({ apiKey, lat, lng, category, radiusMeters });
      } catch {
        return [] as Resource[];
      }
    });

    const byId = new Map<string, Resource & { distanceMiles: number }>();
    for (const list of batches) {
      for (const r of list) {
        // Strict: only keep places tagged with a selected category.
        if (!targets.includes(r.category)) continue;
        const distanceMiles = Number(haversineMiles(lat, lng, r.latitude, r.longitude).toFixed(1));
        const limit = Number.isFinite(maxMiles) && maxMiles < 25 ? maxMiles : 50;
        if (distanceMiles > limit) continue;
        if (!byId.has(r.id)) byId.set(r.id, { ...r, recommended: false, distanceMiles });
      }
    }

    // If empty, widen radius for the SAME selected categories only — never mix in others.
    if (byId.size === 0) {
      const wider = await mapPool(targets, 2, (category) =>
        searchGooglePlaces({ apiKey, lat, lng, category, radiusMeters: 50000 }),
      );
      for (const list of wider) {
        for (const r of list) {
          if (!targets.includes(r.category)) continue;
          const distanceMiles = Number(haversineMiles(lat, lng, r.latitude, r.longitude).toFixed(1));
          if (!byId.has(r.id)) byId.set(r.id, { ...r, recommended: false, distanceMiles });
        }
      }
    }

    let resources = filterResourcesByCategories([...byId.values()], targets);
    resources = markClosestRecommended(resources);
    resources = resources.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return (a.distanceMiles ?? 99) - (b.distanceMiles ?? 99);
    });

    return NextResponse.json({
      resources,
      source: "google_places",
      center: { lat, lng },
      count: resources.length,
      categories: targets,
      recommendedRule: "top_2_closest",
      warning:
        resources.length === 0
          ? "Google returned no places in range for your selected needs. Try again or pick another category."
          : undefined,
    });
  } catch {
    return NextResponse.json({
      resources: [],
      source: "google_places",
      center: { lat, lng },
      count: 0,
      warning: "Temporary connection issue reaching Google Places. Tap Retry.",
    });
  }
}
