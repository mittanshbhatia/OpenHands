"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { useNearbyPlaces } from "@/lib/places/useNearbyPlaces";

export default function NeedHelpNowPage() {
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const { resources, loading, error } = useNearbyPlaces(origin, ["shelter", "food", "hygiene", "medical"], 15);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your location" }),
      () => setOrigin(null),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  const urgent = resources
    .filter((r) => r.openStatus === "open_now" || r.openStatus === "closing_soon" || r.recommended)
    .slice(0, 8);

  return (
    <div className="space-y-6 pb-10">
      <header className="rounded-3xl bg-coral-500 p-6 text-white shadow-soft">
        <h1 className="text-3xl font-semibold">I Need Help Now</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90">
          Real places open near you from Google Places. Availability changes — call ahead when you can.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="tel:211"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-coral-600"
          >
            Call 211
          </a>
          <Link
            href="/assistant"
            className="inline-flex min-h-11 items-center rounded-full border border-white/40 px-4 text-sm font-semibold"
          >
            Ask Assistant
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-full border border-white/40 px-4 text-sm font-semibold"
          >
            Start with your location
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-semibold">Open or recommended nearby</h2>
        {!origin ? (
          <p className="mt-4 text-sm text-teal-800/80">Allow location access to load real places around you.</p>
        ) : loading ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-teal-800">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching Google Places…
          </p>
        ) : error ? (
          <p className="mt-4 text-sm text-coral-700">{error}</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {urgent.map((r) => (
              <li key={r.id}>
                <ResourceCard resource={r} distanceMiles={r.distanceMiles} />
              </li>
            ))}
          </ul>
        )}
        {origin && !loading && urgent.length === 0 && !error ? (
          <p className="mt-4 text-sm text-teal-800/80">No open listings returned. Try Find Help or call 211.</p>
        ) : null}
      </section>
    </div>
  );
}
