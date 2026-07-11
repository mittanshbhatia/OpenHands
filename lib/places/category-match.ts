import type { ResourceCategory } from "@/types";

type PlaceSignals = {
  displayName?: { text?: string };
  editorialSummary?: { text?: string };
  types?: string[];
};

/**
 * Keep results aligned with the category the user picked.
 * Food-only must not mix in overnight shelters; shelter-only must not mix in pantries; etc.
 * When multiple categories are selected, each place is scored against its own search category.
 */
export function placeFitsCategory(place: PlaceSignals, category: ResourceCategory): boolean {
  const name = (place.displayName?.text || "").toLowerCase();
  const summary = (place.editorialSummary?.text || "").toLowerCase();
  const types = (place.types || []).map((t) => t.toLowerCase());
  const blob = `${name} ${summary} ${types.join(" ")}`;

  const foodSignal =
    /\b(food bank|food pantry|soup kitchen|meal program|free meal|community meal|meals on wheels|pantry|feeding|grocery|dining hall|soup)\b/.test(
      blob,
    ) ||
    types.some((t) =>
      ["meal_takeaway", "restaurant", "food", "bakery", "cafe", "supermarket", "meal_delivery"].includes(t),
    );

  const shelterSignal =
    /\b(homeless shelter|emergency shelter|overnight shelter|transitional housing|shelter for|safe haven|emergency housing)\b/.test(
      blob,
    ) ||
    (/\bshelter\b/.test(name) && !foodSignal);

  const clothingSignal =
    /\b(clothing|thrift|goodwill|closet|apparel|coat|shoes)\b/.test(blob) ||
    types.some((t) => ["clothing_store", "shoe_store"].includes(t));

  const medicalSignal =
    /\b(clinic|hospital|urgent care|health center|medical|dental)\b/.test(blob) ||
    types.some((t) => ["hospital", "doctor", "dentist", "physiotherapist", "health"].includes(t));

  const librarySignal = /\b(library)\b/.test(blob) || types.includes("library");

  switch (category) {
    case "food":
      // Pure overnight shelters without meal/food wording do not belong in food results.
      if (shelterSignal && !foodSignal) return false;
      if (/\b(motel|hotel|inn)\b/.test(name) && !foodSignal) return false;
      return true;
    case "shelter":
      // Food banks / soup kitchens alone are not shelters.
      if (foodSignal && !shelterSignal) return false;
      if (types.includes("restaurant") && !shelterSignal) return false;
      if (types.includes("supermarket") && !shelterSignal) return false;
      return true;
    case "clothing":
      if (shelterSignal && !clothingSignal) return false;
      if (foodSignal && !clothingSignal && !/\b(thrift|goodwill|clothing)\b/.test(blob)) return false;
      return true;
    case "donation":
      if (medicalSignal && !/\b(donation|charity|goodwill|salvation)\b/.test(blob)) return false;
      return true;
    case "medical":
      if (shelterSignal && !medicalSignal) return false;
      if (foodSignal && !medicalSignal) return false;
      return true;
    case "internet":
      return librarySignal || /\b(wifi|wi-fi|computer lab|community center)\b/.test(blob) || true;
    case "hygiene":
      if (shelterSignal && !/\b(shower|hygiene|day center|restroom|bathroom)\b/.test(blob)) {
        return /\b(day center|shower|hygiene)\b/.test(blob) || !/\bovernight\b/.test(blob);
      }
      return true;
    case "employment":
    case "transportation":
    case "legal":
      return true;
    default:
      return true;
  }
}

/** Client/API safety: only keep resources whose category is in the user's selection. */
export function filterResourcesByCategories<T extends { category: ResourceCategory }>(
  resources: T[],
  categories: ResourceCategory[],
): T[] {
  if (!categories.length) return [];
  const allow = new Set(categories);
  return resources.filter((r) => allow.has(r.category));
}
