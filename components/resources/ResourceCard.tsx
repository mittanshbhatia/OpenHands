"use client";

import Link from "next/link";
import { BadgeCheck, MapPin, Phone } from "lucide-react";
import type { Resource } from "@/types";
import { CATEGORY_LABELS } from "@/lib/demo/seed";
import { useSaved } from "@/lib/saved/local-saved";
import clsx from "clsx";

const statusLabel: Record<string, string> = {
  open_now: "Open now",
  closing_soon: "Closing soon",
  opens_later: "Opens later today",
  appointment: "Appointment required",
  unconfirmed: "Availability unconfirmed",
  unavailable: "Temporarily unavailable",
};

export function ResourceCard({
  resource,
  distanceMiles,
}: {
  resource: Resource;
  distanceMiles?: number;
}) {
  const { ids, toggleSave } = useSaved();
  const saved = ids.includes(resource.id);
  const verified =
    resource.verificationStatus === "verified_org" ||
    resource.verificationStatus === "verified_moderator";

  return (
    <article className="rounded-2xl border border-sage-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
            {CATEGORY_LABELS[resource.category]}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-teal-900">
            <Link href={`/resources/${resource.id}`} className="hover:underline">
              {resource.name}
            </Link>
          </h3>
        </div>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            Verified
          </span>
        ) : (
          <span className="rounded-full bg-cream-100 px-2 py-1 text-xs font-medium text-teal-800">
            Community
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-teal-900/80">{resource.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span
          className={clsx(
            "rounded-full px-2.5 py-1 font-medium",
            resource.openStatus === "open_now"
              ? "bg-teal-100 text-teal-800"
              : "bg-sage-100 text-teal-800",
          )}
        >
          {statusLabel[resource.openStatus]}
        </span>
        {typeof distanceMiles === "number" && (
          <span className="rounded-full bg-sage-100 px-2.5 py-1 text-teal-800">
            {distanceMiles} mi
          </span>
        )}
        <span className="rounded-full bg-sage-100 px-2.5 py-1 text-teal-800">
          Confirmed {resource.lastVerifiedAt}
        </span>
      </div>
      <p className="mt-3 flex items-start gap-2 text-sm text-teal-800">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {resource.address}, {resource.city}
      </p>
      {resource.phone && (
        <p className="mt-1 flex items-center gap-2 text-sm text-teal-800">
          <Phone className="h-4 w-4" aria-hidden />
          <a className="underline" href={`tel:${resource.phone}`}>
            {resource.phone}
          </a>
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/resources/${resource.id}`}
          className="inline-flex min-h-11 items-center rounded-full bg-teal-700 px-4 text-sm font-semibold text-white"
        >
          View details
        </Link>
        <button
          type="button"
          onClick={() => toggleSave(resource.id)}
          className="inline-flex min-h-11 items-center rounded-full border border-sage-200 px-4 text-sm font-semibold text-teal-800"
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}
