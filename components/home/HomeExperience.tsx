"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HandHeart, LifeBuoy, Loader2, Navigation } from "lucide-react";
import { useSaved } from "@/lib/saved/local-saved";

const HERO_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=1400&q=55",
  "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1400&q=55",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=55",
  "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1400&q=55",
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=55",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=55",
  "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=1400&q=55",
];

type Origin = { lat: number; lng: number; label?: string };

async function geocodeAddress(query: string): Promise<Origin | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data[0]) return null;
    const shortLabel = data[0].display_name.split(",").slice(0, 2).join(",");
    return { lat: Number(data[0].lat), lng: Number(data[0].lon), label: shortLabel };
  } catch {
    return null;
  }
}

export function HomeExperience() {
  const router = useRouter();
  const { recordLocation } = useSaved();
  const [bg, setBg] = useState(HERO_BACKGROUNDS[0]);
  const [bgReady, setBgReady] = useState(false);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [needLocationHint, setNeedLocationHint] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setNeedLocationHint(q.get("needLocation") === "1");
  }, []);

  useEffect(() => {
    const pick = HERO_BACKGROUNDS[Math.floor(Math.random() * HERO_BACKGROUNDS.length)];
    setBg(pick);
    const img = new window.Image();
    img.fetchPriority = "high";
    img.decoding = "async";
    img.src = pick;
    if (img.complete) setBgReady(true);
    else {
      img.onload = () => setBgReady(true);
      img.onerror = () => setBgReady(true);
    }
  }, []);

  function goToExplore(origin: Origin, source: "typed" | "gps") {
    try {
      sessionStorage.setItem(
        "openhands.lastOrigin",
        JSON.stringify({ lat: origin.lat, lng: origin.lng, label: origin.label }),
      );
    } catch {
      /* ignore */
    }
    recordLocation({
      label: origin.label ?? (source === "gps" ? "Your location" : "Entered location"),
      lat: origin.lat,
      lng: origin.lng,
      source,
    });
    const params = new URLSearchParams({
      lat: String(origin.lat),
      lng: String(origin.lng),
      label: origin.label ?? "Your location",
    });
    // Resume a Saved → Directions open that needed location first
    if (typeof window !== "undefined") {
      const pendingNav = new URLSearchParams(window.location.search).get("nav");
      if (pendingNav) params.set("nav", pendingNav);
    }
    router.push(`/explore?${params.toString()}`);
  }

  function useMyLocation() {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Location isn't available on this device. Type an address instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        goToExplore(
          { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your location" },
          "gps",
        ),
      () => {
        setLocating(false);
        setLocationError("Permission denied. Type your address or city instead.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  async function submitAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setLocating(true);
    setLocationError(null);
    const found = await geocodeAddress(address.trim());
    if (found) {
      goToExplore(found, "typed");
    } else {
      setLocating(false);
      setLocationError("We couldn't find that address. Try a city name or ZIP code.");
    }
  }

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#141210]">
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${bgReady ? "opacity-100" : "opacity-0"}`}
        style={{
          backgroundImage: `url('${bg}')`,
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 6%, #000 14%, #000 78%, rgba(0,0,0,0.55) 90%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 6%, #000 14%, #000 78%, rgba(0,0,0,0.55) 90%, transparent 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(20,18,16,0.55) 0%, rgba(20,18,16,0.28) 18%, rgba(20,18,16,0.35) 55%, rgba(20,18,16,0.72) 78%, rgba(20,18,16,0.97) 100%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-24">
        <h1 className="max-w-3xl font-serif text-4xl italic font-medium leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
          Essential help should never be hard to find.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          Free and donation-based meals, shelter, clothing, hygiene, and care near you. No account,
          no cost, ever.
        </p>

        <div className="mt-8 max-w-xl">
          <p className="mb-2 text-sm font-medium text-white/80">
            {needLocationHint
              ? "Set your location to open directions for that saved place:"
              : "Start by telling us where you are:"}
          </p>
          <form onSubmit={submitAddress} className="flex items-center gap-1 rounded-full bg-white p-1 shadow-soft">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your address, city, or ZIP"
              aria-label="Your address, city, or ZIP"
              disabled={locating}
              className="min-h-11 flex-1 rounded-full bg-transparent px-4 text-sm text-teal-900 outline-none placeholder:text-sage-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={locating}
              className="flex min-h-11 items-center gap-1.5 rounded-full bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Continue
            </button>
          </form>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 px-5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 disabled:opacity-60"
          >
            <Navigation className="h-4 w-4" aria-hidden />
            Use my location automatically
          </button>
          {locationError ? (
            <p className="mt-2 text-sm text-coral-400" role="alert">
              {locationError}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/need-help-now"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-coral-500 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-coral-600"
          >
            <LifeBuoy className="h-4 w-4" aria-hidden />
            I need help now
          </Link>
          <Link
            href="/give-help"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 px-5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            <HandHeart className="h-4 w-4" aria-hidden />
            Give help
          </Link>
        </div>
      </div>
    </section>
  );
}
