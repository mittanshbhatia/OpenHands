import L from "leaflet";
import type { ResourceCategory } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  food: "#cf5230",
  shelter: "#124f3b",
  clothing: "#1f7a5c",
  hygiene: "#3b82a0",
  medical: "#b45309",
  employment: "#5b6b8a",
  transportation: "#0e7490",
  legal: "#6d28d9",
  internet: "#0369a1",
  donation: "#e56b45",
};

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "#124f3b";
}

export function categoryIcon(category: ResourceCategory | string, selected = false) {
  const color = categoryColor(category);
  const size = selected ? 36 : 30;
  const label = (category?.[0] ?? "?").toUpperCase();
  return L.divIcon({
    className: "openhands-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};border:3px solid ${selected ? "#fff7ed" : "#fff"};
      box-shadow:0 4px 14px rgba(11,47,36,.35);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font:700 12px/1 system-ui,sans-serif;
      transform:translateY(-2px);
    ">${label}</div>`,
  });
}

export function originIcon() {
  return L.divIcon({
    className: "openhands-origin",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="
      width:22px;height:22px;border-radius:9999px;
      background:#e56b45;border:3px solid #fff;
      box-shadow:0 0 0 6px rgba(229,107,69,.25);
    "></div>`,
  });
}
