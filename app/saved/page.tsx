"use client";

import Link from "next/link";
import { getResourceById } from "@/lib/matching/resources";
import { useSaved } from "@/lib/saved/local-saved";
import { ResourceCard } from "@/components/resources/ResourceCard";

export default function SavedPage() {
  const { ids, planIds, removeFromPlan, clearPlan, toggleSave } = useSaved();
  const saved = ids.map((id) => getResourceById(id)).filter(Boolean);
  const plan = planIds.map((id) => getResourceById(id)).filter(Boolean);

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">Saved & My Plan</h1>
        <p className="mt-1 text-sm text-teal-800/80">Stored in this browser only (demo).</p>
      </header>

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
          <p className="mt-3 text-sm text-teal-800/70">
            No plan items yet. Add resources from detail pages.{" "}
            <Link href="/find-help" className="font-semibold underline">
              Find Help
            </Link>
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {plan.map((r) =>
              r ? (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-sage-200 bg-white p-4">
                  <div>
                    <Link href={`/resources/${r.id}`} className="font-semibold text-teal-800 hover:underline">
                      {r.name}
                    </Link>
                    <p className="text-sm text-teal-800/70">{r.hours}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromPlan(r.id)}
                    className="text-sm font-semibold text-coral-600"
                  >
                    Remove
                  </button>
                </li>
              ) : null,
            )}
          </ol>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Saved resources</h2>
        {saved.length === 0 ? (
          <p className="mt-3 text-sm text-teal-800/70">Nothing saved yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {saved.map((r) =>
              r ? (
                <li key={r.id} className="relative">
                  <ResourceCard resource={r} />
                  <button
                    type="button"
                    onClick={() => toggleSave(r.id)}
                    className="mt-2 text-sm font-semibold text-coral-600"
                  >
                    Unsave
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
