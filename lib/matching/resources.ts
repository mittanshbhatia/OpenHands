import { resources } from "@/lib/demo/seed";
import type { Resource, ResourceCategory } from "@/types";

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type ResourceFilters = {
  query?: string;
  category?: ResourceCategory | "all";
  openNow?: boolean;
  walkIn?: boolean;
  noId?: boolean;
  familyFriendly?: boolean;
  wheelchair?: boolean;
  verifiedOnly?: boolean;
  maxMiles?: number;
  origin?: { lat: number; lng: number } | null;
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

export function searchResources(filters: ResourceFilters): Array<Resource & { distanceMiles: number }> {
  const origin = filters.origin ?? { lat: 37.7749, lng: -122.4194 };
  const inferred = filters.query ? inferCategoriesFromQuery(filters.query) : [];

  let offsetLat = 0;
  let offsetLng = 0;
  if (filters.origin && haversineMiles(filters.origin.lat, filters.origin.lng, 37.7749, -122.4194) > 10) {
    // If the user is outside San Francisco, offset the demo data to cluster around their location.
    offsetLat = filters.origin.lat - 37.7749;
    offsetLng = filters.origin.lng - -122.4194;
  }

  return resources
    .map((r) => {
      const adaptedLat = r.latitude + offsetLat;
      const adaptedLng = r.longitude + offsetLng;
      return {
        ...r,
        latitude: adaptedLat,
        longitude: adaptedLng,
        distanceMiles: Number(haversineMiles(origin.lat, origin.lng, adaptedLat, adaptedLng).toFixed(1)),
      };
    })
    .filter((r) => {
      if (filters.category && filters.category !== "all" && r.category !== filters.category) return false;
      if (inferred.length && filters.query && !inferred.includes(r.category)) {
        // still allow text match in name/description
        const q = filters.query.toLowerCase();
        if (!`${r.name} ${r.description} ${r.essentials.join(" ")}`.toLowerCase().includes(q)) return false;
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
        if (r.openStatus === "open_now") s += 50;
        if (r.verificationStatus.startsWith("verified")) s += 30;
        s += Math.max(0, 20 - r.distanceMiles);
        return s;
      };
      return score(b) - score(a);
    });
}

export function getResourceById(id: string) {
  return resources.find((r) => r.id === id || r.slug === id);
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
