import { haversineMiles } from "@/lib/matching/geo";
import type { Resource, ResourceCategory } from "@/types";

export { haversineMiles };

export type ResourceFilters = {
  query?: string;
  category?: ResourceCategory | "all";
  /** When set, only these categories appear (food-only → food only; food+shelter → both). */
  categories?: ResourceCategory[];
  openNow?: boolean;
  walkIn?: boolean;
  noId?: boolean;
  familyFriendly?: boolean;
  wheelchair?: boolean;
  verifiedOnly?: boolean;
  maxMiles?: number;
  origin?: { lat: number; lng: number } | null;
  /** Live Google Places results for this session (no fictional seed). */
  catalog?: Resource[];
};

const INTENT_MAP: Array<{ pattern: RegExp; categories: ResourceCategory[] }> = [
  { pattern: /(food|dinner|meal|eat|hungry|pantry)/i, categories: ["food"] },
  { pattern: /(sleep|shelter|bed|tonight|safe)/i, categories: ["shelter"] },
  { pattern: /(jacket|coat|cloth|shoes|warm)/i, categories: ["clothing"] },
  { pattern: /(shower|hygiene|restroom|bathroom)/i, categories: ["hygiene"] },
  { pattern: /(doctor|clinic|medical|mental)/i, categories: ["medical"] },
  { pattern: /(job|work|employ)/i, categories: ["employment"] },
  { pattern: /(bus|transit|ride|transport)/i, categories: ["transportation"] },
  { pattern: /(id|legal|benefits)/i, categories: ["legal"] },
  { pattern: /(wifi|internet|charg)/i, categories: ["internet"] },
];

export function inferCategoriesFromQuery(query: string): ResourceCategory[] {
  const hits = INTENT_MAP.filter((i) => i.pattern.test(query)).flatMap((i) => i.categories);
  return [...new Set(hits)];
}

/**
 * Filter/sort a live catalog of real Google Places.
 * Never invents coordinates or offsets places to fake proximity.
 */
export function searchResources(filters: ResourceFilters): Array<Resource & { distanceMiles: number }> {
  const origin = filters.origin;
  const catalog = filters.catalog ?? [];
  if (!origin || catalog.length === 0) return [];

  const inferred = filters.query ? inferCategoriesFromQuery(filters.query) : [];

  return catalog
    .map((r) => ({
      ...r,
      distanceMiles: Number(haversineMiles(origin.lat, origin.lng, r.latitude, r.longitude).toFixed(1)),
    }))
    .filter((r) => {
      if (filters.categories?.length && !filters.categories.includes(r.category)) return false;
      if (filters.category && filters.category !== "all" && r.category !== filters.category) return false;
      if (inferred.length && filters.query) {
        const q = filters.query.toLowerCase();
        const textHit = `${r.name} ${r.description} ${r.essentials.join(" ")}`.toLowerCase().includes(q);
        // Query intent must match — don't mix unrelated categories.
        if (!inferred.includes(r.category) && !textHit) return false;
        if (inferred.length && !inferred.includes(r.category)) return false;
      }
      if (filters.openNow && r.openStatus !== "open_now" && r.openStatus !== "closing_soon") return false;
      if (filters.walkIn && !r.walkInAllowed) return false;
      if (filters.noId && r.idRequired) return false;
      if (filters.familyFriendly && !r.familyFriendly) return false;
      if (filters.wheelchair && !r.wheelchairAccessible) return false;
      if (
        filters.verifiedOnly &&
        r.verificationStatus !== "verified_org" &&
        r.verificationStatus !== "verified_moderator"
      ) {
        return false;
      }
      if (filters.maxMiles && r.distanceMiles > filters.maxMiles) return false;
      return true;
    })
    .sort((a, b) => {
      const score = (r: Resource & { distanceMiles: number }) => {
        let s = 0;
        if (r.recommended) s += 60;
        if (r.openStatus === "open_now") s += 50;
        if (r.verificationStatus.startsWith("verified")) s += 30;
        s += (r.rating ?? 0) * 8;
        s += Math.max(0, 20 - r.distanceMiles);
        return s;
      };
      return score(b) - score(a);
    });
}

export function getResourceById(id: string, catalog: Resource[] = []) {
  return catalog.find((r) => r.id === id || r.slug === id || r.placeId === id);
}

export function explainDonationMatch(input: {
  category: string;
  distanceMiles: number;
  urgency: string;
  remaining: number;
  locationName: string;
}) {
  return `${input.locationName} is ${input.distanceMiles.toFixed(1)} miles away, is accepting ${input.category.toLowerCase()}, and still needs ${input.remaining} more. Urgency: ${input.urgency.replace("_", " ")}.`;
}
