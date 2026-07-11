"use client";

import { useState } from "react";
import { BedDouble, Phone, Star } from "lucide-react";
import type { Resource } from "@/types";

/**
 * Only shelters and places that need a reservation / call-ahead get this UI.
 * Food pantries, clothing, hygiene, libraries, etc. are walk-up — no booking button.
 */
export function needsAdvanceReservation(resource: Resource): boolean {
  if (resource.category === "shelter") return true;
  if (resource.appointmentRequired) return true;
  if (resource.category === "legal") return true;
  return false;
}

/**
 * Real booking = collect info, then call the provider's real phone.
 * We never claim a bed is held inside the app.
 */
export function ReserveSpotButton({ resource }: { resource: Resource }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState("1");
  const [when, setWhen] = useState("tonight");
  const [called, setCalled] = useState(false);

  if (!needsAdvanceReservation(resource)) return null;

  const dial = resource.bookingPhone || resource.phone;
  const isShelter = resource.category === "shelter";
  const label = isShelter ? "Call to ask about a bed" : "Call to reserve / ask ahead";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-coral-500 px-3 text-xs font-semibold text-white transition hover:bg-coral-600"
      >
        <BedDouble className="h-3.5 w-3.5" aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-sage-200 bg-cream-50 p-3 text-left">
      <p className="text-xs font-semibold text-teal-900">
        {isShelter
          ? "Beds are only held by the shelter. We will help you call them."
          : "This place usually needs a call or reservation before you go."}
      </p>
      {resource.bookingNotes ? (
        <p className="mt-1 text-[11px] text-teal-800/80">{resource.bookingNotes}</p>
      ) : null}

      <label className="mt-3 block text-[11px] font-medium text-teal-800">
        Your first name
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 min-h-9 w-full rounded-xl border border-sage-200 bg-white px-3 text-sm"
          required
        />
      </label>
      <label className="mt-2 block text-[11px] font-medium text-teal-800">
        Your phone (so they can call back)
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          className="mt-1 min-h-9 w-full rounded-xl border border-sage-200 bg-white px-3 text-sm"
        />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block text-[11px] font-medium text-teal-800">
          People
          <input
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            inputMode="numeric"
            className="mt-1 min-h-9 w-full rounded-xl border border-sage-200 bg-white px-3 text-sm"
          />
        </label>
        <label className="block text-[11px] font-medium text-teal-800">
          When
          <select
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="mt-1 min-h-9 w-full rounded-xl border border-sage-200 bg-white px-2 text-sm"
          >
            <option value="tonight">Tonight</option>
            <option value="today">Today</option>
            <option value="this_week">This week</option>
          </select>
        </label>
      </div>

      {dial ? (
        <a
          href={`tel:${dial.replace(/[^\d+]/g, "")}`}
          onClick={() => {
            try {
              localStorage.setItem(
                `openhands.call.${resource.id}`,
                JSON.stringify({ firstName, phone, people, when, at: Date.now(), place: resource.name }),
              );
            } catch {
              /* ignore */
            }
            setCalled(true);
          }}
          className={`mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white ${
            firstName.trim() ? "bg-[#188038] hover:bg-[#137333]" : "pointer-events-none bg-sage-300"
          }`}
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call {resource.name.split(" ").slice(0, 3).join(" ")} {dial}
        </a>
      ) : (
        <p className="mt-3 text-xs text-coral-600">
          No phone listed on Google for this place.{" "}
          {resource.googleMapsUri ? (
            <a className="underline" href={resource.googleMapsUri} target="_blank" rel="noreferrer">
              Open Google Maps listing
            </a>
          ) : (
            "Search the name on Google Maps."
          )}
        </p>
      )}

      {called ? (
        <p className="mt-2 text-[11px] font-medium text-[#188038]">
          Call started. Ask about a spot for {people} ({when}). Give your name: {firstName || "…"}.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-2 text-[11px] font-semibold text-teal-700 underline"
      >
        Close
      </button>
    </div>
  );
}

export function RatingBadge({ resource }: { resource: Resource }) {
  if (typeof resource.rating !== "number") {
    return <span className="text-xs text-teal-800/60">No Google rating yet</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-900">
      <Star className="h-3.5 w-3.5 fill-[#fbbc04] text-[#fbbc04]" aria-hidden />
      {resource.rating.toFixed(1)}
      {typeof resource.reviewCount === "number" ? (
        <span className="text-teal-800/60">({resource.reviewCount})</span>
      ) : null}
      {resource.recommended ? (
        <span className="ml-1 rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1967d2]">
          Closest
        </span>
      ) : null}
    </span>
  );
}
