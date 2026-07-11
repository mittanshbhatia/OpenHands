"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bus,
  BriefcaseBusiness,
  HeartHandshake,
  Home,
  Loader2,
  MapPin,
  Navigation,
  Scale,
  Shirt,
  ShowerHead,
  Stethoscope,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import { ResourceMap } from "@/components/maps/ResourceMap";
import { BookmarkButton } from "@/components/resources/BookmarkButton";
import { RatingBadge, ReserveSpotButton } from "@/components/resources/ReserveSpot";
import { ShadedScroll } from "@/components/ui/ShadedScroll";
import { CATEGORY_LABELS } from "@/lib/places/labels";
import { useNearbyPlaces } from "@/lib/places/useNearbyPlaces";
import { useSaved } from "@/lib/saved/local-saved";
import { CATEGORY_COLORS } from "@/lib/maps/colors";
import type { Resource, ResourceCategory } from "@/types";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  food: UtensilsCrossed,
  shelter: Home,
  clothing: Shirt,
  hygiene: ShowerHead,
  medical: Stethoscope,
  employment: BriefcaseBusiness,
  transportation: Bus,
  legal: Scale,
  internet: Wifi,
  donation: HeartHandshake,
};

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-teal-800/70">Loading…</div>}>
      <ExploreInner />
    </Suspense>
  );
}

function ExploreInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { recordDirection, byId } = useSaved();

  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const label = params.get("label") ?? "Your location";
  const navId = params.get("nav");
  const catsKey = params.get("cats") || "";
  const origin = useMemo(
    () => (Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, label } : null),
    [lat, lng, label],
  );

  const catsFromUrl = useMemo(() => {
    return catsKey
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean) as ResourceCategory[];
  }, [catsKey]);

  // Common flow: no cats → always ask food/shelter/etc. Direct nav= skips to route screen.
  const [phase, setPhase] = useState<"choose" | "results" | "navigate">(() => {
    if (navId) return "navigate";
    if (catsFromUrl.length) return "results";
    return "choose";
  });
  const [selectedCats, setSelectedCats] = useState<Set<ResourceCategory>>(
    () => new Set(catsFromUrl),
  );
  const [focusId, setFocusId] = useState<string | null>(navId);

  useEffect(() => {
    if (origin) {
      try {
        sessionStorage.setItem(
          "openhands.lastOrigin",
          JSON.stringify({ lat: origin.lat, lng: origin.lng, label: origin.label }),
        );
      } catch {
        /* ignore */
      }
    }
  }, [origin?.lat, origin?.lng, origin?.label]);

  useEffect(() => {
    if (navId) {
      setFocusId(navId);
      setPhase("navigate");
      return;
    }
    if (catsKey) {
      setSelectedCats(new Set(catsFromUrl));
      setPhase("results");
    } else {
      setPhase("choose");
      setFocusId(null);
    }
  }, [navId, catsKey, catsFromUrl]);

  const { resources, loading, error, warning, reload } = useNearbyPlaces(
    phase === "choose" || (phase === "navigate" && !catsFromUrl.length && !selectedCats.size)
      ? null
      : origin,
    selectedCats.size ? selectedCats : catsFromUrl,
    25,
  );

  const results = resources;
  const navTarget = useMemo(() => {
    if (!focusId) return null;
    return results.find((r) => r.id === focusId) ?? byId[focusId] ?? null;
  }, [results, focusId, byId]);

  useEffect(() => {
    if (phase !== "navigate" || !navTarget) return;
    recordDirection(navTarget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, navTarget?.id]);

  function goChoose() {
    if (!origin) return;
    setPhase("choose");
    setFocusId(null);
    setSelectedCats(new Set());
    router.replace(
      `/explore?lat=${origin.lat}&lng=${origin.lng}&label=${encodeURIComponent(origin.label)}`,
    );
  }

  function goResults() {
    if (!origin || selectedCats.size === 0) return;
    const cats = [...selectedCats];
    setPhase("results");
    setFocusId(null);
    router.replace(
      `/explore?lat=${origin.lat}&lng=${origin.lng}&label=${encodeURIComponent(origin.label)}&cats=${cats.join(",")}`,
    );
  }

  function startNavigate(id: string) {
    if (!origin) return;
    setFocusId(id);
    setPhase("navigate");
    const cats = [...selectedCats];
    const q = new URLSearchParams({
      lat: String(origin.lat),
      lng: String(origin.lng),
      label: origin.label,
      nav: id,
    });
    if (cats.length) q.set("cats", cats.join(","));
    router.replace(`/explore?${q.toString()}`);
  }

  if (!origin) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-semibold text-teal-900">We need your location first</h1>
        <p className="mt-2 text-sm text-teal-800/80">Head back to the start and share where you are.</p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-teal-700 px-6 text-sm font-semibold text-white"
        >
          Go to start
        </Link>
      </div>
    );
  }

  function toggleCategory(key: ResourceCategory) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (phase === "choose") {
    return (
      <div className="pb-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Start over
        </button>

        <div className="mt-4 flex items-center gap-2 text-sm text-teal-800">
          <MapPin className="h-4 w-4 text-coral-500" aria-hidden />
          <span className="font-medium">{origin.label}</span>
        </div>

        <h1 className="mt-4 font-serif text-3xl italic font-medium text-teal-900 sm:text-4xl">
          What do you need today?
        </h1>
        <p className="mt-1 text-sm text-teal-800/80">
          We search Google Places for the needs you pick near{" "}
          <strong>{origin.label}</strong> — food only shows food, shelter only shows shelters, both shows both.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(Object.keys(CATEGORY_LABELS) as ResourceCategory[]).map((key) => {
            const Icon = CATEGORY_ICONS[key] ?? HeartHandshake;
            const active = selectedCats.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCategory(key)}
                aria-pressed={active}
                className={`group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left shadow-soft transition hover:-translate-y-0.5 ${
                  active
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-sage-200 bg-white text-teal-900 hover:border-coral-400"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    active ? "bg-white/15" : "bg-sage-100"
                  }`}
                >
                  <Icon className={active ? "h-5 w-5 text-white" : "h-5 w-5 text-teal-700"} />
                </span>
                <span className="text-sm font-semibold">{CATEGORY_LABELS[key]}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            disabled={selectedCats.size === 0}
            onClick={goResults}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral-500 px-7 text-sm font-semibold text-white shadow-soft transition hover:bg-coral-600 disabled:opacity-50"
          >
            Find real places nearby
            <Navigation className="h-4 w-4" aria-hidden />
          </button>
          {selectedCats.size === 0 ? (
            <span className="text-sm text-teal-800/70">Pick at least one to continue.</span>
          ) : null}
        </div>
      </div>
    );
  }

  if (phase === "navigate" && navTarget) {
    return (
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 px-4 pb-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 py-2">
          <button
            type="button"
            onClick={() => {
              setFocusId(null);
              if (selectedCats.size || catsFromUrl.length) {
                setPhase("results");
                if (origin) {
                  const cats = [...(selectedCats.size ? selectedCats : catsFromUrl)];
                  router.replace(
                    `/explore?lat=${origin.lat}&lng=${origin.lng}&label=${encodeURIComponent(origin.label)}&cats=${cats.join(",")}`,
                  );
                }
              } else {
                goChoose();
              }
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />{" "}
            {selectedCats.size || catsFromUrl.length ? "Back to listings" : "What do you need?"}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <BookmarkButton resource={navTarget} />
            <ReserveSpotButton resource={navTarget} />
          </div>
        </div>

        <ResourceMap
          resources={[navTarget]}
          center={origin}
          origin={origin}
          focusId={navTarget.id}
          navMode
          onExitNav={() => {
            setFocusId(null);
            if (selectedCats.size || catsFromUrl.length) setPhase("results");
            else goChoose();
          }}
          heightClass="h-[calc(100svh-9rem)] min-h-[480px]"
        />
      </div>
    );
  }

  if (phase === "navigate" && !navTarget) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-teal-800/80">That place isn’t available on this device anymore.</p>
        <button
          type="button"
          onClick={goChoose}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-teal-700 px-5 text-sm font-semibold text-white"
        >
          Choose food, shelter, and more
        </button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goChoose}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Change what you need
        </button>
        <div className="flex items-center gap-2 text-sm text-teal-800">
          <MapPin className="h-4 w-4 text-coral-500" aria-hidden />
          <span className="font-medium">{origin.label}</span>
        </div>
      </div>

      <h1 className="mt-4 font-serif text-3xl italic font-medium text-teal-900">Real places near you</h1>
      <p className="mt-1 text-sm text-teal-800/80">
        {loading
          ? "Searching Google Places around your location…"
          : `${results.length} verified Google listings for ${[...(selectedCats.size ? selectedCats : catsFromUrl)].join(", ") || "your needs"}. Closest 2 marked.`}
      </p>

      {error ? (
        <div className="mt-4 rounded-2xl border border-coral-200 bg-coral-50 p-4 text-sm text-coral-800">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-3 min-h-10 rounded-full bg-teal-700 px-4 text-sm font-semibold text-white"
          >
            Retry search
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
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          Loading real shelters and services near you…
        </div>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-w-0">
            <ResourceMap
              resources={results}
              center={origin}
              origin={origin}
              onNavigate={(id) => startNavigate(id)}
              heightClass="h-[560px]"
            />
          </div>

          <ShadedScroll>
            {results.map((r, i) => (
              <LocationRow
                key={r.id}
                resource={r}
                letter={String.fromCharCode(65 + (i % 26))}
                onDirections={() => startNavigate(r.id)}
              />
            ))}
            {results.length === 0 && !error ? (
              <div className="rounded-2xl border border-dashed border-sage-200 bg-white p-8 text-center text-sm text-teal-800/80">
                No Google Places matches in range. Try another category or a wider area.
              </div>
            ) : null}
          </ShadedScroll>
        </div>
      )}
    </div>
  );
}

function LocationRow({
  resource,
  letter,
  onDirections,
}: {
  resource: Resource & { distanceMiles?: number };
  letter: string;
  onDirections: () => void;
}) {
  const color = CATEGORY_COLORS[resource.category] ?? "#8E8E93";
  const open = resource.openStatus === "open_now" || resource.openStatus === "closing_soon";
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-sage-200 bg-white p-4 shadow-soft transition">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
        style={{ background: color }}
        aria-hidden
      >
        {letter}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/resources/${encodeURIComponent(resource.placeId || resource.id)}?category=${resource.category}`}
            className="font-semibold text-teal-900 hover:underline"
          >
            {resource.name}
          </Link>
          {resource.recommended ? (
            <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1967d2]">
              Closest
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-sm text-teal-800/70">
          {resource.address}
          {resource.city ? `, ${resource.city}` : ""}
          {typeof resource.distanceMiles === "number" ? ` · ${resource.distanceMiles} mi` : ""}
        </p>
        <div className="mt-1">
          <RatingBadge resource={resource} />
        </div>
        <p className="mt-1 text-sm">
          <span className={open ? "font-medium text-green-700" : "font-medium text-teal-800/70"}>
            {open ? "Open" : resource.nextOpenLabel}
          </span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ReserveSpotButton resource={resource} />
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <BookmarkButton resource={resource} compact />
        <button
          type="button"
          onClick={onDirections}
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold text-[#1a73e8] transition hover:bg-sage-100"
          aria-label={`Directions to ${resource.name}`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#1a73e8]">
            <Navigation className="h-4 w-4" aria-hidden />
          </span>
          Directions
        </button>
      </div>
    </div>
  );
}
