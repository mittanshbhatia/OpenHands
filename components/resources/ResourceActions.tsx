"use client";

import { useState } from "react";
import Link from "next/link";
import { useSaved } from "@/lib/saved/local-saved";
import { BookmarkButton } from "@/components/resources/BookmarkButton";
import { exploreNavigateHref } from "@/lib/maps/nav-links";
import type { Resource } from "@/types";

export function ResourceActions({ resource }: { resource: Resource }) {
  const { addToPlan } = useSaved();
  const [status, setStatus] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  return (
    <section className="rounded-2xl border border-sage-200 bg-white p-5">
      <h2 className="font-semibold">Actions</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={exploreNavigateHref(resource)}
          className="inline-flex min-h-11 items-center rounded-full bg-teal-700 px-4 text-sm font-semibold text-white"
        >
          Directions
        </Link>
        <BookmarkButton resource={resource} />
        <button
          type="button"
          onClick={() => {
            addToPlan(resource);
            setStatus("Added to My Plan. See the Saved tab.");
          }}
          className="min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold"
        >
          Add to My Plan
        </button>
        <button
          type="button"
          onClick={async () => {
            const text = `${resource.name}. ${resource.address}${resource.phone ? `. ${resource.phone}` : ""}`;
            try {
              if (navigator.share) {
                await navigator.share({ title: resource.name, text, url: resource.googleMapsUri });
              } else {
                await navigator.clipboard.writeText(text);
                setStatus("Copied to clipboard.");
              }
            } catch {
              /* user dismissed share sheet */
            }
          }}
          className="min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold"
        >
          Share
        </button>
        <button
          type="button"
          onClick={() =>
            setStatus("Thanks. We rely on Google Places for live data; call the provider if hours look wrong.")
          }
          className="min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold"
        >
          Report outdated info
        </button>
      </div>
      {status ? (
        <p className="mt-3 rounded-xl bg-cream-100 px-3 py-2 text-sm text-teal-900" role="status">
          {status}
        </p>
      ) : null}
      <div className="mt-4">
        <fieldset>
          <legend className="text-sm font-medium">Was this information accurate?</legend>
          {feedbackGiven ? (
            <p className="mt-2 text-sm text-teal-800" role="status">
              Thanks! Your feedback helps.
            </p>
          ) : (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setFeedbackGiven(true)}
                className="min-h-11 rounded-full bg-sage-100 px-4 text-sm"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFeedbackGiven(true)}
                className="min-h-11 rounded-full bg-sage-100 px-4 text-sm"
              >
                Needs update
              </button>
            </div>
          )}
        </fieldset>
      </div>
    </section>
  );
}
