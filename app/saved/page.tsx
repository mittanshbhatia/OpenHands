"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSaved } from "@/lib/saved/local-saved";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { exploreNavigateHref, readLastOrigin } from "@/lib/maps/nav-links";
import { Bookmark, MapPin, MessageSquareText, Navigation } from "lucide-react";
import type { Resource } from "@/types";

export default function SavedPage() {
  const router = useRouter();
  const {
    ids,
    planIds,
    byId,
    directions,
    locations,
    chatSummaries,
    removeFromPlan,
    clearPlan,
    toggleSave,
    clearDirections,
    clearLocations,
    clearChatSummaries,
  } = useSaved();

  const saved = ids.map((id) => byId[id]).filter(Boolean) as Resource[];
  const plan = planIds.map((id) => byId[id]).filter(Boolean) as Resource[];

  function openDirections(resource: Resource) {
    const origin =
      readLastOrigin() ??
      (locations[0]
        ? { lat: locations[0].lat, lng: locations[0].lng, label: locations[0].label }
        : null);
    router.push(exploreNavigateHref(resource, origin));
  }

  return (
    <div className="space-y-8 pb-28">
      <header>
        <h1 className="text-3xl font-semibold">Saved & My Plan</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          Bookmarks first — then directions, locations, and chat summaries. Everything stays on this device.
        </p>
      </header>

      <section>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Bookmark className="h-5 w-5 text-coral-500" aria-hidden />
          Bookmarked places
        </h2>
        <p className="mt-1 text-sm text-teal-800/70">
          Tap Bookmark on any listing. Open Directions for the same live route screen.
        </p>
        {saved.length === 0 ? (
          <p className="mt-3 text-sm text-teal-800/70">No bookmarks yet — use Bookmark on a listing.</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {saved.map((r) => (
              <li key={r.id}>
                <ResourceCard resource={r} />
                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openDirections(r)}
                    className="text-sm font-semibold text-teal-700 underline"
                  >
                    Open directions
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSave(r)}
                    className="text-sm font-semibold text-coral-600"
                  >
                    Remove bookmark
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Navigation className="h-5 w-5 text-coral-500" aria-hidden />
            Directions you asked for
          </h2>
          {directions.length ? (
            <button type="button" onClick={clearDirections} className="text-sm font-semibold text-teal-700 underline">
              Clear
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-teal-800/70">
          Only places you tapped Directions for — not every listing from a search.
        </p>
        {directions.length === 0 ? (
          <p className="mt-3 text-sm text-teal-800/70">No directions yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {directions.map((d) => (
              <li key={d.id} className="rounded-2xl border border-sage-200 bg-white p-4 shadow-soft">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-teal-900">{d.resource.name}</p>
                    <p className="mt-0.5 text-sm text-teal-800/70">{d.resource.address}</p>
                    <p className="mt-2 text-xs text-teal-800/50">
                      {new Date(d.at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openDirections(d.resource)}
                    className="inline-flex min-h-10 items-center rounded-full bg-teal-700 px-4 text-sm font-semibold text-white"
                  >
                    Directions
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MapPin className="h-5 w-5 text-coral-500" aria-hidden />
            Locations you set
          </h2>
          {locations.length ? (
            <button type="button" onClick={clearLocations} className="text-sm font-semibold text-teal-700 underline">
              Clear
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-teal-800/70">
          Opening one starts the food / shelter picker again.
        </p>
        {locations.length === 0 ? (
          <p className="mt-3 text-sm text-teal-800/70">No locations yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {locations.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sage-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-teal-900">{l.label}</p>
                  <p className="text-xs text-teal-800/60">
                    {l.source === "gps" ? "GPS" : "Typed"} ·{" "}
                    {new Date(l.at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Link
                  href={`/explore?lat=${l.lat}&lng=${l.lng}&label=${encodeURIComponent(l.label)}`}
                  className="text-sm font-semibold text-teal-700 underline"
                >
                  What do you need?
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <MessageSquareText className="h-5 w-5 text-coral-500" aria-hidden />
            Assistant chat summaries
          </h2>
          {chatSummaries.length ? (
            <button
              type="button"
              onClick={clearChatSummaries}
              className="text-sm font-semibold text-teal-700 underline"
            >
              Clear
            </button>
          ) : null}
        </div>
        {chatSummaries.length === 0 ? (
          <p className="mt-3 text-sm text-teal-800/70">No chat summaries yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {chatSummaries.map((c) => (
              <li key={c.id} className="rounded-2xl border border-sage-200 bg-white p-4">
                <p className="text-sm leading-relaxed text-teal-900">{c.summary}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {c.topics.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">My Plan</h2>
          {planIds.length ? (
            <button type="button" onClick={clearPlan} className="text-sm font-semibold text-teal-700 underline">
              Clear plan
            </button>
          ) : null}
        </div>
        {plan.length === 0 ? (
          <p className="mt-3 text-sm text-teal-800/70">No plan items yet.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {plan.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-sage-200 bg-white p-4"
              >
                <div>
                  <p className="font-semibold text-teal-800">{r.name}</p>
                  <p className="text-sm text-teal-800/70">{r.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openDirections(r)}
                    className="text-sm font-semibold text-teal-700 underline"
                  >
                    Directions
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromPlan(r.id)}
                    className="text-sm font-semibold text-coral-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
