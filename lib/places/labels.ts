import type { ResourceCategory } from "@/types";

export const CATEGORY_LABELS: Record<ResourceCategory | string, string> = {
  food: "Food",
  shelter: "Shelter",
  clothing: "Clothing",
  hygiene: "Hygiene",
  medical: "Medical",
  employment: "Employment",
  transportation: "Transportation",
  legal: "Legal help",
  internet: "Internet & charging",
  donation: "Donation locations",
};

export const IMPACT_STATS = {
  essentialsMatched: 0,
  donationsCoordinated: 0,
  activeLocations: 0,
  communityVolunteers: 0,
};
