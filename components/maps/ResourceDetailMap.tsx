"use client";

import { ResourceMap, MapLegend } from "@/components/maps/ResourceMap";
import type { Resource } from "@/types";
import { DEMO_CENTER } from "@/lib/demo/seed";

export function ResourceDetailMap({ resource }: { resource: Resource }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">Map & route</h2>
      <p className="text-sm text-teal-800/80">
        Satellite map with a path from the SF demo start point. Switch to Walk or Drive, or use Find Help
        with your location for a personal route.
      </p>
      <ResourceMap
        resources={[resource]}
        center={{ lat: resource.latitude, lng: resource.longitude }}
        origin={DEMO_CENTER}
        focusId={resource.id}
        heightClass="h-[420px]"
      />
      <MapLegend />
    </section>
  );
}
