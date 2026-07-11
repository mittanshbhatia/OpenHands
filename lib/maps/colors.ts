/** Category colors shared by map pins and non-map UI. Leaflet-free so it's safe to import during SSR. */
export const CATEGORY_COLORS: Record<string, string> = {
  food: "#FF9F0A",
  shelter: "#BF5AF2",
  clothing: "#FFD60A",
  hygiene: "#32ADE6",
  medical: "#FF3B30",
  employment: "#5E5CE6",
  transportation: "#0A84FF",
  legal: "#8E8E93",
  internet: "#34C759",
  donation: "#FF2D55",
};

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "#8E8E93";
}
