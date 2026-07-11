"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { exploreChooseHref, readLastOrigin } from "@/lib/maps/nav-links";
import { useSaved } from "@/lib/saved/local-saved";

/**
 * Find Help always lands on the shared “What do you need today?” picker.
 */
export default function FindHelpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-teal-800">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Opening…
        </div>
      }
    >
      <FindHelpRedirect />
    </Suspense>
  );
}

function FindHelpRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const { locations, recordLocation } = useSaved();
  const [note, setNote] = useState("Opening “What do you need today?”…");

  useEffect(() => {
    const latQ = Number(params.get("lat"));
    const lngQ = Number(params.get("lng"));
    if (Number.isFinite(latQ) && Number.isFinite(lngQ)) {
      const next = { lat: latQ, lng: lngQ, label: params.get("label") || "Your location" };
      try {
        sessionStorage.setItem("openhands.lastOrigin", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      recordLocation({ ...next, label: next.label, source: "gps" });
      router.replace(exploreChooseHref(next));
      return;
    }

    const stored = readLastOrigin();
    const fromSaved = locations[0]
      ? { lat: locations[0].lat, lng: locations[0].lng, label: locations[0].label }
      : null;
    const origin = stored ?? fromSaved;

    if (origin) {
      router.replace(exploreChooseHref(origin));
      return;
    }

    if (!navigator.geolocation) {
      setNote("We need your location first.");
      return;
    }

    setNote("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your location",
        };
        try {
          sessionStorage.setItem("openhands.lastOrigin", JSON.stringify(next));
        } catch {
          /* ignore */
        }
        recordLocation({ ...next, source: "gps" });
        router.replace(exploreChooseHref(next));
      },
      () => setNote("Location permission needed. Start from the home page, then Find Help."),
      { enableHighAccuracy: false, timeout: 10000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, params]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-teal-700" aria-hidden />
      <p className="text-sm text-teal-800">{note}</p>
      {note.includes("home") || note.includes("permission") || note.includes("need your location") ? (
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full bg-teal-700 px-5 text-sm font-semibold text-white"
        >
          Go to start
        </Link>
      ) : null}
    </div>
  );
}
