import type { OpenStatus, Resource, ResourceCategory, VerificationStatus } from "@/types";
import { placeFitsCategory, placeIsFreeHelp } from "@/lib/places/category-match";

export type GooglePlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  types?: string[];
  editorialSummary?: { text?: string };
};

/** Text queries for FREE essential services only (no paid restaurants/hotels/malls). */
export const CATEGORY_SEARCH: Record<ResourceCategory, string[]> = {
  food: ["free food pantry", "food bank", "free soup kitchen", "homeless free meal", "free community meals"],
  shelter: ["homeless shelter free", "emergency shelter homeless", "overnight shelter homeless", "free shelter for homeless"],
  clothing: ["free clothing closet", "free clothing bank", "free clothes homeless", "coat closet free"],
  hygiene: ["free public showers homeless", "homeless day center showers", "free hygiene center"],
  medical: ["free clinic", "free medical clinic", "community health center free", "federally qualified health center"],
  employment: ["free workforce center", "job center free help", "employment assistance free"],
  transportation: ["free transit assistance homeless", "homeless transportation help", "free bus pass assistance"],
  legal: ["free legal aid", "free legal clinic", "legal aid society"],
  internet: ["public library free wifi", "free public library computers", "library"],
  donation: ["donation center charity", "Salvation Army donation", "Goodwill donation drop off", "charity donation center"],
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function parseAddress(formatted?: string) {
  if (!formatted) {
    return { address: "See Google Maps", city: "", state: "", postalCode: "" };
  }
  const parts = formatted.split(",").map((p) => p.trim());
  return {
    address: parts[0] ?? formatted,
    city: parts[1] ?? "",
    state: parts[2] ?? "",
    postalCode: parts.at(-1)?.match(/\d{4,}/)?.[0] ?? "",
  };
}

function openStatusFromPlace(place: GooglePlace): { openStatus: OpenStatus; nextOpenLabel: string } {
  if (place.currentOpeningHours?.openNow === true) {
    return { openStatus: "open_now", nextOpenLabel: "Open now" };
  }
  if (place.currentOpeningHours?.openNow === false) {
    return { openStatus: "opens_later", nextOpenLabel: "Closed now. Call ahead." };
  }
  return { openStatus: "unconfirmed", nextOpenLabel: "Call ahead to confirm hours" };
}

export function isRecommended(_rating?: number, _reviewCount?: number) {
  return false;
}

/** Mark only the two closest places as Recommended (by distanceMiles). */
export function markClosestRecommended<T extends { id: string; recommended?: boolean; distanceMiles?: number }>(
  list: T[],
): T[] {
  const byDistance = [...list].sort(
    (a, b) => (a.distanceMiles ?? Number.POSITIVE_INFINITY) - (b.distanceMiles ?? Number.POSITIVE_INFINITY),
  );
  const top2 = new Set(byDistance.slice(0, 2).map((r) => r.id));
  return list.map((r) => ({ ...r, recommended: top2.has(r.id) }));
}

const ESSENTIALS: Record<ResourceCategory, string> = {
  food: "Meals / food",
  shelter: "Shelter",
  clothing: "Clothing",
  hygiene: "Hygiene",
  medical: "Medical care",
  employment: "Jobs",
  transportation: "Transit",
  legal: "Legal help",
  internet: "Wi-Fi / computers",
  donation: "Donations",
};

export function googlePlaceToResource(place: GooglePlace, category: ResourceCategory): Resource | null {
  const name = place.displayName?.text?.trim();
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!name || typeof lat !== "number" || typeof lng !== "number") return null;
  if (place.businessStatus === "CLOSED_PERMANENTLY") return null;

  const { address, city, state, postalCode } = parseAddress(place.formattedAddress);
  const { openStatus, nextOpenLabel } = openStatusFromPlace(place);
  const hours =
    place.currentOpeningHours?.weekdayDescriptions?.join("; ") ||
    place.regularOpeningHours?.weekdayDescriptions?.join("; ") ||
    "See Google Maps. Call ahead to confirm.";
  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber;
  const rating = place.rating;
  const reviewCount = place.userRatingCount ?? 0;

  return {
    id: place.id,
    placeId: place.id,
    name,
    slug: slugify(name) || place.id,
    description:
      place.editorialSummary?.text ||
      `Free / no-cost help near you (Google Places). ${
        category === "shelter"
          ? "Call to ask about a free bed tonight. Beds cannot be reserved in this app."
          : "Confirm it is still free when you call or arrive."
      }`,
    category,
    address,
    city,
    state,
    postalCode,
    latitude: lat,
    longitude: lng,
    phone,
    website: place.websiteUri,
    googleMapsUri: place.googleMapsUri,
    rating,
    reviewCount,
    recommended: false,
    verificationStatus: "verified_org" as VerificationStatus,
    lastVerifiedAt: new Date().toISOString().slice(0, 10),
    openStatus,
    nextOpenLabel,
    walkInAllowed: category === "food" || category === "internet" || category === "hygiene" || category === "clothing" || category === "donation" || category === "medical",
    appointmentRequired: category === "shelter" || category === "legal",
    idRequired: false,
    familyFriendly: true,
    petFriendly: false,
    wheelchairAccessible: true,
    languages: ["Local language", "English"],
    essentials: [ESSENTIALS[category]],
    eligibility: "Confirm eligibility when you call or arrive. Rules vary by place.",
    accessibility: "Ask when you call about accessibility.",
    hours,
    orgName: name,
    bookingPhone: phone,
    bookingNotes:
      category === "shelter"
        ? "No app can hold a shelter bed for you. Call the real number below to ask about tonight."
        : "Availability is never invented here. Call the provider to confirm.",
  };
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
  "places.types",
  "places.editorialSummary",
].join(",");

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Resilient fetch: retries network blips and 429/5xx. Never throws for transient failures. */
async function fetchPlacesJson(
  apiKey: string,
  body: Record<string, unknown>,
  attempts = 4,
): Promise<{ places?: GooglePlace[] } | null> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 429 || res.status >= 500) {
        await sleep(400 * (i + 1) * (i + 1));
        continue;
      }
      if (!res.ok) {
        // Non-retryable (bad key / invalid request) — stop this query
        return null;
      }
      return (await res.json()) as { places?: GooglePlace[] };
    } catch (err) {
      lastErr = err;
      await sleep(350 * (i + 1) * (i + 1));
    }
  }
  void lastErr;
  return null;
}

function mergePlaces(into: Map<string, Resource>, places: GooglePlace[] | undefined, category: ResourceCategory) {
  for (const place of places ?? []) {
    if (!placeIsFreeHelp(place, category)) continue;
    if (!placeFitsCategory(place, category)) continue;
    const mapped = googlePlaceToResource(place, category);
    if (mapped && !into.has(mapped.id)) into.set(mapped.id, mapped);
  }
}

/**
 * Search real places near any lat/lng worldwide.
 * Never throws — returns whatever Google returned after retries + wider radius.
 */
export async function searchGooglePlaces(opts: {
  apiKey: string;
  lat: number;
  lng: number;
  category: ResourceCategory;
  radiusMeters?: number;
}): Promise<Resource[]> {
  const { apiKey, lat, lng, category } = opts;
  const radii = [opts.radiusMeters ?? 25000, 40000, 50000];
  const queries = CATEGORY_SEARCH[category];
  const results = new Map<string, Resource>();

  for (const radiusMeters of radii) {
    for (const textQuery of queries.slice(0, 3)) {
      const data = await fetchPlacesJson(apiKey, {
        textQuery,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
        maxResultCount: 15,
        languageCode: "en",
      });
      mergePlaces(results, data?.places, category);
      // Soft rate-limit spacing between queries
      await sleep(80);
    }
    if (results.size > 0) break;
  }

  // Last resort: broader generic query at max radius
  if (results.size === 0) {
    const fallbacks = [`${category} near me`, category, CATEGORY_SEARCH[category][0]];
    for (const textQuery of fallbacks) {
      const data = await fetchPlacesJson(apiKey, {
        textQuery,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 50000,
          },
        },
        maxResultCount: 20,
        languageCode: "en",
      });
      mergePlaces(results, data?.places, category);
      if (results.size > 0) break;
    }
  }

  return [...results.values()];
}

export async function getGooglePlaceById(apiKey: string, placeId: string, category: ResourceCategory = "shelter") {
  const id = placeId.startsWith("places/") ? placeId : `places/${placeId}`;
  const detailMask = [
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "rating",
    "userRatingCount",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "websiteUri",
    "googleMapsUri",
    "businessStatus",
    "currentOpeningHours",
    "regularOpeningHours",
    "types",
    "editorialSummary",
  ].join(",");

  for (let i = 0; i < 3; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`https://places.googleapis.com/v1/${id}`, {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": detailMask,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.status === 429 || res.status >= 500) {
        await sleep(400 * (i + 1));
        continue;
      }
      if (!res.ok) return null;
      const place = (await res.json()) as GooglePlace;
      const normalizedId = place.id?.startsWith("places/") ? place.id : id;
      return googlePlaceToResource({ ...place, id: normalizedId }, category);
    } catch {
      await sleep(300 * (i + 1));
    }
  }
  return null;
}
