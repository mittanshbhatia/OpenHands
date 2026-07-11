import type { ResourceCategory } from "@/types";

type PlaceSignals = {
  displayName?: { text?: string };
  editorialSummary?: { text?: string };
  types?: string[];
  formattedAddress?: string;
};

const PAID_TYPES = new Set([
  "restaurant",
  "cafe",
  "bakery",
  "bar",
  "meal_takeaway",
  "meal_delivery",
  "supermarket",
  "grocery_or_supermarket",
  "convenience_store",
  "shopping_mall",
  "department_store",
  "clothing_store",
  "shoe_store",
  "lodging",
  "hotel",
  "motel",
  "gas_station",
  "bank",
  "atm",
  "car_dealer",
  "car_rental",
  "movie_theater",
  "gym",
  "spa",
]);

const FREE_SIGNAL =
  /\b(free|no cost|no charge|food bank|food pantry|soup kitchen|homeless|emergency shelter|overnight shelter|charity|nonprofit|non-profit|salvation army|st\.?\s*vincent|catholic charities|meals on wheels|feeding|clothing closet|clothing bank|free clinic|community health center|fqhc|legal aid|public library|day center|hygiene kit|donation center|donation drop)\b/i;

const PAID_SIGNAL =
  /\b(restaurant|cafe|coffee|starbucks|mcdonald|burger|pizza|hotel|motel|inn|resort|paid|membership|private|urgent care|shopping (center|mall)|marketplace|grocery|supermarket|walmart|target|costco|pharmacy retail|\$|price|for sale|thrift store)\b/i;

function blobOf(place: PlaceSignals) {
  const name = place.displayName?.text || "";
  const summary = place.editorialSummary?.text || "";
  const types = (place.types || []).join(" ");
  const address = place.formattedAddress || "";
  return `${name} ${summary} ${types} ${address}`.toLowerCase();
}

/**
 * OpenHands is for people who need free help.
 * Reject restaurants, hotels, malls, and other paid businesses.
 */
export function placeIsFreeHelp(place: PlaceSignals, category: ResourceCategory): boolean {
  const name = (place.displayName?.text || "").toLowerCase();
  const types = (place.types || []).map((t) => t.toLowerCase());
  const blob = blobOf(place);
  const hasFree = FREE_SIGNAL.test(blob);
  const hasPaid = PAID_SIGNAL.test(blob);
  const paidType = types.some((t) => PAID_TYPES.has(t));

  // Hard reject obvious paid businesses unless the name clearly says free help.
  if (paidType && !hasFree) return false;
  if (hasPaid && !hasFree) return false;
  if (/\b(motel|hotel|inn|resort)\b/.test(name)) return false;
  if (/\b(shopping (center|mall)|marketplace)\b/.test(name) && !hasFree) return false;

  switch (category) {
    case "food":
      // Only pantries / soup kitchens / free meal programs — not restaurants or grocery stores.
      if (types.some((t) => ["restaurant", "cafe", "bakery", "meal_takeaway", "supermarket"].includes(t)) && !hasFree) {
        return false;
      }
      return (
        /\b(food bank|food pantry|soup kitchen|free meal|community meal|meals on wheels|feeding|pantry|kitchen)\b/.test(
          blob,
        ) || hasFree
      );
    case "shelter":
      return (
        /\b(homeless shelter|emergency shelter|overnight shelter|transitional housing|shelter for|safe haven|emergency housing|homeless)\b/.test(
          blob,
        ) || (/\bshelter\b/.test(name) && !/\b(animal|pet|bus|tax)\b/.test(name))
      );
    case "clothing":
      // Free closets / banks — not retail thrift that charges.
      if (types.includes("clothing_store") && !/\b(free|closet|bank|charity|homeless)\b/.test(blob)) return false;
      return /\b(free clothing|clothing closet|clothing bank|coat drive|free clothes|donation.*cloth)\b/.test(blob) || hasFree;
    case "medical":
      // Free / community clinics — not private urgent care / hospitals that bill.
      if (/\b(urgent care|emergency room|er\b|private)\b/.test(blob) && !hasFree) return false;
      return (
        /\b(free clinic|community health|fqhc|sliding scale|free medical|free dental|health center)\b/.test(blob) ||
        hasFree
      );
    case "hygiene":
      return /\b(shower|hygiene|day center|restroom|bathroom|wash)\b/.test(blob) || hasFree;
    case "legal":
      return /\b(legal aid|free legal|pro bono|public defender)\b/.test(blob) || hasFree;
    case "internet":
      return types.includes("library") || /\b(library|free (wifi|wi-fi)|computer lab)\b/.test(blob);
    case "employment":
      return /\b(workforce|job center|employment|career center|one-stop)\b/.test(blob) || hasFree;
    case "transportation":
      // Prefer free / assistance programs over ticketed stations.
      if (/\b(uber|lyft|taxi|rental)\b/.test(blob)) return false;
      return /\b(transit (assist|help|pass)|free (bus|ride|transit)|homeless.*transport)\b/.test(blob) || hasFree;
    case "donation":
      // Drop-off points for people giving help (not paid retail).
      return (
        /\b(donation|donate|charity|goodwill|salvation|drop[- ]?off)\b/.test(blob) || hasFree
      );
    default:
      return hasFree && !hasPaid;
  }
}

/**
 * Keep results aligned with the category the user picked.
 * Food-only must not mix in overnight shelters; shelter-only must not mix in pantries; etc.
 */
export function placeFitsCategory(place: PlaceSignals, category: ResourceCategory): boolean {
  if (!placeIsFreeHelp(place, category)) return false;

  const name = (place.displayName?.text || "").toLowerCase();
  const blob = blobOf(place);

  const foodSignal = /\b(food bank|food pantry|soup kitchen|meal program|free meal|community meal|meals on wheels|pantry|feeding|dining hall|soup)\b/.test(
    blob,
  );
  const shelterSignal =
    /\b(homeless shelter|emergency shelter|overnight shelter|transitional housing|shelter for|safe haven|emergency housing)\b/.test(
      blob,
    ) || (/\bshelter\b/.test(name) && !foodSignal);

  switch (category) {
    case "food":
      if (shelterSignal && !foodSignal) return false;
      return true;
    case "shelter":
      if (foodSignal && !shelterSignal) return false;
      return true;
    case "clothing":
      if (shelterSignal && !/\b(cloth|closet|coat)\b/.test(blob)) return false;
      return true;
    case "medical":
      if (shelterSignal && !/\b(clinic|health|medical)\b/.test(blob)) return false;
      if (foodSignal && !/\b(clinic|health|medical)\b/.test(blob)) return false;
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
