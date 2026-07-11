"use client";

import { useEffect, useState } from "react";
import type { Resource } from "@/types";
import { CATEGORY_LABELS } from "@/lib/demo/seed";

type Props = {
  resources: Array<Resource & { distanceMiles?: number }>;
  center?: { lat: number; lng: number };
  origin?: { lat: number; lng: number; label?: string } | null;
  focusId?: string | null;
  heightClass?: string;
  navMode?: boolean;
  onExitNav?: () => void;
  onNavigate?: (id: string) => void;
};

export function ResourceMap(props: Props) {
  const [MapView, setMapView] = useState<null | React.ComponentType<Props>>(null);

  useEffect(() => {
    let mounted = true;
    import("./ResourceMapInner").then((mod) => {
      if (mounted) setMapView(() => mod.ResourceMapInner);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!MapView) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-2xl border border-sage-200 bg-sage-100 text-sm text-teal-800">
        Loading interactive map…
      </div>
    );
  }

  return <MapView {...props} />;
}

export function MapLegend() {
  return (
    <p className="mt-2 text-xs text-teal-800/70">
      Use the filter chips to show only what you need ({Object.values(CATEGORY_LABELS).slice(0, 4).join(", ")}
      , …). Colored pins mark each category. Tap one to draw a walk or drive path from your start point.
      Switch to satellite anytime with the layer control (top-right). A full list view is always available.
    </p>
  );
}
