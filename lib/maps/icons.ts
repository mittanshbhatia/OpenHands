import L from "leaflet";
import type { ResourceCategory } from "@/types";

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

export const CATEGORY_GLYPHS: Record<string, string> = {
  food: '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />',
  shelter: '<path d="M12 3l9 8h-3v8h-4v-6H10v6H6v-8H3l9-8z" />',
  clothing: '<path d="M20.6 5.4l-4.2-2.3c-.6-.3-1.4-.2-1.9.3L12 5.6 9.5 3.4c-.5-.5-1.3-.6-1.9-.3L3.4 5.4C2.6 5.8 2 6.6 2 7.5v12.4C2 21 2.9 22 4 22h16c1.1 0 2-.9 2-2V7.5c0-.9-.6-1.7-1.4-2.1z" />',
  hygiene: '<path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />',
  medical: '<path d="M19 10h-5V5c0-1.1-.9-2-2-2h-0c-1.1 0-2 .9-2 2v5H5c-1.1 0-2 .9-2 2v0c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h0c1.1 0 2-.9 2-2v-5h5c1.1 0 2-.9 2-2v0c0-1.1-.9-2-2-2z" />',
  employment: '<path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4z" />',
  transportation: '<path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />',
  legal: '<path d="M12 2L2 7h2v10h16V7h2l-10-5zm-5 13H5V9h2v6zm6 0h-2V9h2v6zm6 0h-2V9h2v6z" />',
  internet: '<path d="M12 3C6.95 3 2.3 5.05 0 8.3L12 21 24 8.3C21.7 5.05 17.05 3 12 3zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />',
  donation: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />'
};

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "#8E8E93";
}

export function categoryIcon(category: ResourceCategory | string, selected = false) {
  const color = categoryColor(category);
  const glyph = CATEGORY_GLYPHS[category] || '<circle cx="12" cy="12" r="6" fill="white"/>';
  const width = selected ? 38 : 32;
  const height = selected ? 48 : 40;
  
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">
    <path d="M32 0C14.3269 0 0 14.3269 0 32C0 48 32 70 32 70C32 70 64 48 64 32C64 14.3269 49.6731 0 32 0Z" fill="${color}"/>
    <circle cx="32" cy="76" r="4" fill="${color}" style="mix-blend-mode: multiply; opacity: 0.8"/>
    <circle cx="32" cy="32" r="16" fill="white"/>
    <g transform="translate(20, 20)" fill="${color}">
      ${glyph}
    </g>
  </svg>`;

  return L.divIcon({
    className: "openhands-marker bg-transparent border-0",
    html: svg,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
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

export function liveLocationIcon(heading: number | null) {
  const coneTransform = heading !== null ? `rotate(${heading}deg)` : "rotate(0deg)";
  const coneOpacity = heading !== null ? "1" : "0";
  
  return L.divIcon({
    className: "openhands-live-location",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle at center bottom, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%);
          clip-path: polygon(50% 100%, 15% 0, 85% 0);
          transform-origin: center bottom;
          transform: translateY(-40px) ${coneTransform};
          opacity: ${coneOpacity};
          transition: transform 0.2s ease-out;
        "></div>
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #2563eb;
          border: 3px solid #fff;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
          position: relative;
          z-index: 10;
        "></div>
      </div>
    `,
  });
}
