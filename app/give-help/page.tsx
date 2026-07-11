"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  HeartHandshake,
  Loader2,
  MapPin,
  Navigation,
  Shirt,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { ResourceMap } from "@/components/maps/ResourceMap";
import { BookmarkButton } from "@/components/resources/BookmarkButton";
import { RatingBadge, ReserveSpotButton } from "@/components/resources/ReserveSpot";
import { ShadedScroll } from "@/components/ui/ShadedScroll";
import { useNearbyPlaces } from "@/lib/places/useNearbyPlaces";
import { useSaved } from "@/lib/saved/local-saved";
import { CATEGORY_COLORS } from "@/lib/maps/colors";
import type { Resource, ResourceCategory } from "@/types";

type DonorType = "person" | "business" | null;

const PERSON_CATS: ResourceCategory[] = ["donation", "clothing", "food"];
const BUSINESS_CATS: ResourceCategory[] = ["food", "shelter", "donation"];
const CAT_LABELS: Partial<Record<ResourceCategory, string>> = {
  food: "Food / meals",
  shelter: "Shelters",
  clothing: "Clothing",
  donation: "Donation centers",
};

export default function GiveHelpPage() {
  const { recordDirection, recordLocation } = useSaved();
  const [donorType, setDonorType] = useState<DonorType>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"pick" | "results" | "navigate">("pick");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [selectedCats, setSelectedCats] = useState<Set<ResourceCategory>>(new Set());

  const allowedCats = donorType === "business" ? BUSINESS_CATS : PERSON_CATS;
  const activeCats = selectedCats.size ? [...selectedCats] : [];
  const { resources, loading, error, warning, reload } = useNearbyPlaces(
    phase === "pick" ? null : origin,
    activeCats,
    25,
  );

  useEffect(() => {
    if (!donorType) {
      setSelectedCats(new Set());
      return;
    }
    // Default: all allowed for that donor type; user can narrow to food-only, etc.
    setSelectedCats(new Set(donorType === "business" ? BUSINESS_CATS : PERSON_CATS));
  }, [donorType]);

  function toggleCat(cat: ResourceCategory) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const navTarget = useMemo(() => resources.find((r) => r.id === focusId) ?? null, [resources, focusId]);

  useEffect(() => {
    if (phase !== "navigate" || !navTarget) return;
    recordDirection(navTarget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, navTarget?.id]);

  function useMyLocation() {
    setLocationError(null);
    if (selectedCats.size === 0) {
      setLocationError("Pick at least one category (e.g. food only, or food + shelters).");
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("Location isn't available. Enable GPS or try again from a phone.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your location" };
        recordLocation({ label: next.label!, lat: next.lat, lng: next.lng, source: "gps" });
        setOrigin(next);
        setLocating(false);
        setPhase("results");
      },
      () => {
        setLocating(false);
        setLocationError("Permission denied. Enable location to find real drop-off spots near you.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  if (phase === "navigate" && navTarget && origin) {
    return (
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 px-4 pb-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 py-2">
          <button
            type="button"
            onClick={() => {
              setPhase("results");
              setFocusId(null);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to places
          </button>
          <ReserveSpotButton resource={navTarget} />
        </div>
        <ResourceMap
          resources={[navTarget]}
          center={origin}
          origin={origin}
          focusId={navTarget.id}
          navMode
          onExitNav={() => {
            setPhase("results");
            setFocusId(null);
          }}
          heightClass="h-[calc(100svh-9rem)] min-h-[480px]"
        />
      </div>
    );
  }

  if (phase === "results" && origin && donorType) {
    return (
      <div className="pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setPhase("pick");
              setDonorType(null);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Change donor type
          </button>
          <div className="flex items-center gap-2 text-sm text-teal-800">
            <MapPin className="h-4 w-4 text-coral-500" aria-hidden />
            <span className="font-medium">{origin.label}</span>
          </div>
        </div>

        <h1 className="mt-4 font-serif text-3xl italic font-medium text-teal-900">
          {donorType === "business" ? "Real places that may take surplus" : "Real donation drop-offs near you"}
        </h1>
        <p className="mt-1 text-sm text-teal-800/80">
          {loading
            ? "Searching Google Places…"
            : `${resources.length} listings for ${activeCats.join(", ")}. Closest 2 marked.`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {allowedCats.map((cat) => {
            const on = selectedCats.has(cat);
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={on}
                onClick={() => toggleCat(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  on ? "bg-teal-700 text-white" : "border border-sage-200 bg-white text-teal-800"
                }`}
              >
                {CAT_LABELS[cat] ?? cat}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-coral-200 bg-coral-50 p-4 text-sm text-coral-800">
            {error}
            <button type="button" onClick={() => void reload()} className="ml-3 underline">
              Retry
            </button>
          </div>
        ) : null}
        {warning && !error ? (
          <div className="mt-4 rounded-2xl border border-sage-200 bg-cream-100 p-4 text-sm text-teal-800">
            {warning}
            <button type="button" onClick={() => void reload()} className="ml-3 font-semibold underline">
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-teal-800">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading real places…
          </div>
        ) : (
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative min-w-0">
              <ResourceMap
                resources={resources}
                center={origin}
                origin={origin}
                onNavigate={(id) => {
                  setFocusId(id);
                  setPhase("navigate");
                }}
                heightClass="h-[560px]"
              />
            </div>
            <ShadedScroll>
              {resources.map((r, i) => (
                <GiveRow
                  key={r.id}
                  resource={r}
                  letter={String.fromCharCode(65 + (i % 26))}
                  onDirections={() => {
                    setFocusId(r.id);
                    setPhase("navigate");
                  }}
                />
              ))}
              {resources.length === 0 && !error ? (
                <div className="rounded-2xl border border-dashed border-sage-200 bg-white p-8 text-center text-sm">
                  No Google Places matches nearby. Try again later or widen your area from Find Help.
                </div>
              ) : null}
            </ShadedScroll>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">Give Help</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          Same real Google Places + live directions as Find Help. No fictional drop-offs.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setDonorType("person")}
          className={`rounded-2xl border p-5 text-left shadow-soft ${
            donorType === "person" ? "border-teal-700 ring-2 ring-teal-700/30" : "border-sage-200 bg-white"
          }`}
        >
          <UserRound className="h-5 w-5 text-teal-700" aria-hidden />
          <div className="mt-2 font-semibold">I am a person</div>
          <p className="mt-1 text-sm text-teal-800/80">Donation centers, clothing banks, food pantries near you.</p>
        </button>
        <button
          type="button"
          onClick={() => setDonorType("business")}
          className={`rounded-2xl border p-5 text-left shadow-soft ${
            donorType === "business" ? "border-teal-700 ring-2 ring-teal-700/30" : "border-sage-200 bg-white"
          }`}
        >
          <Building2 className="h-5 w-5 text-teal-700" aria-hidden />
          <div className="mt-2 font-semibold">I am a restaurant or company</div>
          <p className="mt-1 text-sm text-teal-800/80">Real meal programs and shelters that may take surplus food.</p>
        </button>
      </div>

      {donorType ? (
        <div className="space-y-4 rounded-3xl border border-sage-200 bg-white p-5 shadow-soft">
          <div>
            <p className="text-sm font-medium text-teal-900">What are you giving? (pick one or more)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {allowedCats.map((cat) => {
                const on = selectedCats.has(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleCat(cat)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      on ? "bg-teal-700 text-white" : "border border-sage-200 bg-white text-teal-800"
                    }`}
                  >
                    {CAT_LABELS[cat] ?? cat}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-teal-800/70">
              Food only shows food places. Select food + shelters to see both.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-teal-900">Share your location to load real places nearby:</p>
            <button
              type="button"
              disabled={locating || selectedCats.size === 0}
              onClick={useMyLocation}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-teal-700 px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              Use my location
            </button>
            {locationError ? (
              <p className="mt-2 text-sm text-coral-600" role="alert">
                {locationError}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-teal-800/70">
              Or{" "}
              <Link href="/" className="font-semibold underline">
                start from the home page
              </Link>{" "}
              with an address, then come back here.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 text-xs text-teal-800/70">
        <span className="inline-flex items-center gap-1.5">
          <HeartHandshake className="h-3.5 w-3.5" /> Donations
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Shirt className="h-3.5 w-3.5" /> Clothing
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UtensilsCrossed className="h-3.5 w-3.5" /> Food / surplus
        </span>
      </div>
    </div>
  );
}

function GiveRow({
  resource,
  letter,
  onDirections,
}: {
  resource: Resource & { distanceMiles?: number };
  letter: string;
  onDirections: () => void;
}) {
  const color = CATEGORY_COLORS[resource.category] ?? "#8E8E93";
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-sage-200 bg-white p-4 shadow-soft">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: color }}
        aria-hidden
      >
        {letter}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-teal-900">{resource.name}</span>
          {resource.recommended ? (
            <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1967d2]">
              Closest
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-sm text-teal-800/70">
          {resource.address}
          {typeof resource.distanceMiles === "number" ? ` · ${resource.distanceMiles} mi` : ""}
        </p>
        <div className="mt-1">
          <RatingBadge resource={resource} />
        </div>
        {resource.phone ? (
          <a className="mt-1 block text-sm text-teal-700 underline" href={`tel:${resource.phone.replace(/[^\d+]/g, "")}`}>
            {resource.phone}
          </a>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <BookmarkButton resource={resource} compact />
        <button
          type="button"
          onClick={onDirections}
          className="flex flex-col items-center gap-1 text-xs font-semibold text-[#1a73e8]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dadce0] bg-white">
            <Navigation className="h-4 w-4" />
          </span>
          Directions
        </button>
      </div>
    </div>
  );
}
