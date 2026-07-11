"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Navigation } from "lucide-react";
import type { Resource } from "@/types";
import { exploreNavigateHref, readLastOrigin } from "@/lib/maps/nav-links";
import { useSaved } from "@/lib/saved/local-saved";

/**
 * Detail pages don’t show a second map style — they jump straight into the
 * same live GPS navigation screen used from listings.
 */
export function ResourceDetailMap({ resource }: { resource: Resource }) {
  const router = useRouter();
  const { recordLocation } = useSaved();
  const [note, setNote] = useState("Preparing live directions…");
  const [busy, setBusy] = useState(false);

  function goNav(origin: { lat: number; lng: number; label?: string }) {
    try {
      sessionStorage.setItem(
        "openhands.lastOrigin",
        JSON.stringify({ lat: origin.lat, lng: origin.lng, label: origin.label ?? "Your location" }),
      );
    } catch {
      /* ignore */
    }
    router.push(exploreNavigateHref(resource, origin));
  }

  useEffect(() => {
    const stored = readLastOrigin();
    if (stored) {
      goNav(stored);
      return;
    }
    if (!navigator.geolocation) {
      setNote("Location isn’t available. Use Find Help from the home page first.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your location",
        };
        recordLocation({ ...origin, source: "gps" });
        setBusy(false);
        goNav(origin);
      },
      () => {
        setBusy(false);
        setNote("Allow location (or set one on the home page) to open live directions.");
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.id]);

  return (
    <section id="directions" className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold">Live directions</h2>
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-3xl border border-sage-200 bg-white p-8 text-center shadow-soft">
        {busy ? <Loader2 className="h-6 w-6 animate-spin text-teal-700" aria-hidden /> : null}
        <p className="text-sm text-teal-800">{note}</p>
        <button
          type="button"
          onClick={() => {
            setBusy(true);
            setNote("Getting your location…");
            if (!navigator.geolocation) {
              setBusy(false);
              setNote("Location isn’t available on this device.");
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const origin = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  label: "Your location",
                };
                recordLocation({ ...origin, source: "gps" });
                setBusy(false);
                goNav(origin);
              },
              () => {
                setBusy(false);
                setNote("Location permission denied. Set a location on the home page, then try again.");
              },
              { enableHighAccuracy: false, timeout: 10000 },
            );
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-teal-700 px-5 text-sm font-semibold text-white"
        >
          <Navigation className="h-4 w-4" aria-hidden />
          Open live navigation
        </button>
      </div>
    </section>
  );
}
