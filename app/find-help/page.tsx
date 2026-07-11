"use client";

import { useMemo, useState } from "react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { MapLegend, ResourceMap } from "@/components/maps/ResourceMap";
import { CATEGORY_LABELS, DEMO_CENTER } from "@/lib/demo/seed";
import { searchResources } from "@/lib/matching/resources";
import type { ResourceCategory } from "@/types";

export default function FindHelpPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ResourceCategory | "all">("all");
  const [openNow, setOpenNow] = useState(false);
  const [walkIn, setWalkIn] = useState(false);
  const [noId, setNoId] = useState(false);
  const [familyFriendly, setFamilyFriendly] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxMiles, setMaxMiles] = useState(10);
  const [view, setView] = useState<"list" | "map">("map");
  const [origin, setOrigin] = useState(DEMO_CENTER);
  const [locationNote, setLocationNote] = useState(
    "Using San Francisco demo area. Location is optional.",
  );

  const results = useMemo(
    () =>
      searchResources({
        query,
        category,
        openNow,
        walkIn,
        noId,
        familyFriendly,
        wheelchair,
        verifiedOnly,
        maxMiles,
        origin,
      }),
    [query, category, openNow, walkIn, noId, familyFriendly, wheelchair, verifiedOnly, maxMiles, origin],
  );

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationNote("Geolocation unavailable. You can keep browsing demo SF data.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your location" });
        setLocationNote("Using your shared location. You can clear it anytime.");
      },
      () => setLocationNote("Location permission denied. Browsing San Francisco demo data."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-3xl font-semibold text-teal-900">Find Help</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          No account needed. Availability can change — contact providers when possible.
        </p>
      </header>

      <div className="rounded-3xl border border-sage-200 bg-white p-4 shadow-soft">
        <label className="block text-sm font-medium" htmlFor="nl-search">
          What do you need?
        </label>
        <input
          id="nl-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try “I need dinner tonight” or “free shower near me”'
          className="mt-2 min-h-12 w-full rounded-2xl border border-sage-200 px-4 text-sm outline-none focus:border-teal-600"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={requestLocation}
            className="min-h-11 rounded-full bg-teal-700 px-4 text-sm font-semibold text-white"
          >
            Use my location
          </button>
          <button
            type="button"
            onClick={() => {
              setOrigin(DEMO_CENTER);
              setLocationNote("Using San Francisco demo area. Location is optional.");
            }}
            className="min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold"
          >
            Browse SF demo
          </button>
          <div className="inline-flex rounded-full border border-sage-200 p-1">
            <button
              type="button"
              className={`min-h-9 rounded-full px-3 text-sm ${view === "list" ? "bg-teal-700 text-white" : ""}`}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              type="button"
              className={`min-h-9 rounded-full px-3 text-sm ${view === "map" ? "bg-teal-700 text-white" : ""}`}
              onClick={() => setView("map")}
            >
              Map
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-teal-800/70" role="status">
          {locationNote}
        </p>
      </div>

      <details className="rounded-2xl border border-sage-200 bg-white p-4">
        <summary className="cursor-pointer font-semibold">Filters</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Category
            <select
              className="mt-1 min-h-11 w-full rounded-xl border border-sage-200 px-3"
              value={category}
              onChange={(e) => setCategory(e.target.value as ResourceCategory | "all")}
            >
              <option value="all">All</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Distance (miles)
            <input
              type="range"
              min={1}
              max={20}
              value={maxMiles}
              onChange={(e) => setMaxMiles(Number(e.target.value))}
              className="mt-3 w-full"
            />
            <span className="text-xs">Within {maxMiles} miles</span>
          </label>
          <fieldset>
            <legend className="text-sm font-medium">Quick filters</legend>
            <div className="mt-2 grid gap-2 text-sm">
              {[
                ["Open now", openNow, setOpenNow],
                ["Walk-in", walkIn, setWalkIn],
                ["No ID required", noId, setNoId],
                ["Verified only", verifiedOnly, setVerifiedOnly],
              ].map(([label, value, setter]) => (
                <label key={label as string} className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => (setter as (v: boolean) => void)(e.target.checked)}
                  />
                  {label as string}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium">Who this resource supports</legend>
            <div className="mt-2 grid gap-2 text-sm">
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={familyFriendly}
                  onChange={(e) => setFamilyFriendly(e.target.checked)}
                />
                Family-friendly
              </label>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={wheelchair}
                  onChange={(e) => setWheelchair(e.target.checked)}
                />
                Wheelchair accessible
              </label>
            </div>
          </fieldset>
        </div>
      </details>

      <p className="text-sm text-teal-800" role="status">
        {results.length} resources · sorted by open status, verification, and distance
      </p>

      {view === "map" ? (
        <div>
          <ResourceMap resources={results} center={origin} origin={origin} heightClass="h-[520px]" />
          <MapLegend />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {results.map((r) => (
          <ResourceCard key={r.id} resource={r} distanceMiles={r.distanceMiles} />
        ))}
      </div>
      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sage-200 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold">No matching resources</h2>
          <p className="mt-2 text-sm text-teal-800/80">Try widening distance or clearing filters.</p>
        </div>
      ) : null}
    </div>
  );
}
