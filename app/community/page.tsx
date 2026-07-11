"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNearbyPlaces } from "@/lib/places/useNearbyPlaces";
import { ResourceCard } from "@/components/resources/ResourceCard";

export default function CommunityPage() {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const { resources, loading, error } = useNearbyPlaces(origin, ["donation", "food", "shelter", "clothing"], 20);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setOrigin(null),
    );
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">Community</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          Real places near you where neighbors donate, volunteer, and help. Sourced from Google Places.
        </p>
      </header>

      {!origin ? (
        <p className="text-sm text-teal-800/80">Allow location to see real community resources around you.</p>
      ) : loading ? (
        <p className="inline-flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : error ? (
        <p className="text-sm text-coral-700">{error}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((r) => (
            <ResourceCard key={r.id} resource={r} distanceMiles={r.distanceMiles} />
          ))}
        </div>
      )}

      <p className="text-sm">
        <Link href="/give-help" className="font-semibold text-teal-700 underline">
          Give help
        </Link>{" "}
        or{" "}
        <Link href="/" className="font-semibold text-teal-700 underline">
          find help near you
        </Link>
        .
      </p>
    </div>
  );
}
