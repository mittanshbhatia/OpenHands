"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/places/labels";
import { ResourceActions } from "@/components/resources/ResourceActions";
import { ResourceDetailMap } from "@/components/maps/ResourceDetailMap";
import { RatingBadge, ReserveSpotButton } from "@/components/resources/ReserveSpot";
import type { Resource, ResourceCategory } from "@/types";

export default function ResourceDetailPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm">Loading…</div>}>
      <ResourceDetailInner />
    </Suspense>
  );
}

function ResourceDetailInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = decodeURIComponent(params.id);
  const category = (searchParams.get("category") as ResourceCategory) || "shelter";
  const [resource, setResource] = useState<Resource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places?placeId=${encodeURIComponent(id)}&category=${encodeURIComponent(category)}`,
        );
        const data = (await res.json()) as { resources?: Resource[]; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.resources?.[0]) {
          setError(data.error || "This place could not be loaded from Google Places.");
          setResource(null);
        } else {
          setResource(data.resources[0]);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Network error loading this place.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, category]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-teal-800">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading real place details from Google…
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="space-y-4 pb-10">
      <Link href="/find-help" className="text-sm font-semibold text-teal-700 hover:underline">
          Back to Find Help
        </Link>
        <p className="rounded-2xl bg-coral-50 p-4 text-sm text-coral-800">{error || "Not found"}</p>
      </div>
    );
  }

  return (
    <article className="space-y-6 pb-10">
      <Link href="/find-help" className="text-sm font-semibold text-teal-700 hover:underline">
        Back to Find Help
      </Link>
      <header className="rounded-3xl border border-sage-200 bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
            {CATEGORY_LABELS[resource.category]}
          </p>
          {resource.recommended ? (
            <span className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1967d2]">
              Closest
            </span>
          ) : null}
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-teal-900">{resource.name}</h1>
        <div className="mt-2">
          <RatingBadge resource={resource} />
        </div>
        <p className="mt-2 text-teal-800/80">{resource.description}</p>
        <p className="mt-4 rounded-2xl bg-cream-100 px-4 py-3 text-sm text-teal-900">
          This listing is from Google Places. Call the provider before you go — availability changes.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="#directions"
            className="inline-flex min-h-12 items-center rounded-full bg-coral-500 px-6 text-sm font-semibold text-white hover:bg-coral-600"
          >
            Get live directions
          </a>
          {resource.googleMapsUri ? (
            <a
              href={resource.googleMapsUri}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center rounded-full border border-sage-200 px-6 text-sm font-semibold text-teal-800"
            >
              Open in Google Maps
            </a>
          ) : null}
          <ReserveSpotButton resource={resource} />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-sage-200 bg-white p-5">
          <h2 className="font-semibold">Details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-teal-800/60">Address</dt>
              <dd>
                {resource.address}
                {resource.city ? `, ${resource.city}` : ""}
                {resource.state ? `, ${resource.state}` : ""} {resource.postalCode}
              </dd>
            </div>
            <div>
              <dt className="text-teal-800/60">Hours</dt>
              <dd>{resource.hours}</dd>
            </div>
            {resource.phone ? (
              <div>
                <dt className="text-teal-800/60">Phone</dt>
                <dd>
                  <a className="underline" href={`tel:${resource.phone.replace(/[^\d+]/g, "")}`}>
                    {resource.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-teal-800/60">Verified via</dt>
              <dd>Google Places ({resource.lastVerifiedAt})</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-sage-200 bg-white p-5">
          <h2 className="font-semibold">Services & access</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {resource.essentials.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <strong>Eligibility:</strong> {resource.eligibility}
          </p>
          <p className="mt-2 text-sm">
            <strong>Accessibility:</strong> {resource.accessibility}
          </p>
        </div>
      </section>

      <ResourceActions resource={resource} />
      <ResourceDetailMap resource={resource} />
    </article>
  );
}
