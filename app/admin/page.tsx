"use client";

import Link from "next/link";
import { resources, communityNeeds } from "@/lib/demo/seed";
import { useAuth } from "@/lib/auth/demo-auth";

export default function AdminPage() {
  const { user } = useAuth();
  const pending = resources.filter((r) => r.verificationStatus === "community");
  const needsReview = communityNeeds.filter((n) => n.urgency === "critical" || n.urgency === "urgent");

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg space-y-4 pb-10">
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="rounded-2xl bg-cream-100 px-4 py-3 text-sm">
          Sign in as <strong>admin@demo.openhands</strong> / <strong>demo1234</strong> to open the
          moderation dashboard.
        </p>
        <Link href="/profile" className="inline-flex min-h-11 items-center rounded-full bg-teal-700 px-4 text-sm font-semibold text-white">
          Go to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">Admin moderation</h1>
        <p className="mt-1 text-sm text-teal-800/80">Demo queue — actions stay in this browser session.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-sage-200 bg-white p-4">
          <div className="text-2xl font-semibold">{pending.length}</div>
          <div className="text-sm text-teal-800/70">Pending resources</div>
        </div>
        <div className="rounded-2xl border border-sage-200 bg-white p-4">
          <div className="text-2xl font-semibold">{needsReview.length}</div>
          <div className="text-sm text-teal-800/70">High-urgency needs</div>
        </div>
        <div className="rounded-2xl border border-sage-200 bg-white p-4">
          <div className="text-2xl font-semibold">{resources.length}</div>
          <div className="text-sm text-teal-800/70">Directory size</div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Verify community submissions</h2>
        <ul className="mt-3 space-y-2">
          {(pending.length ? pending : resources.slice(0, 3)).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sage-200 bg-white p-4">
              <div>
                <div className="font-semibold">{r.name}</div>
                <div className="text-sm text-teal-800/70">
                  {r.verificationStatus.replaceAll("_", " ")} · {r.city}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => alert(`Verified ${r.name} (demo)`)}
                  className="min-h-10 rounded-full bg-teal-700 px-3 text-sm font-semibold text-white"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Flagged ${r.name} (demo)`)}
                  className="min-h-10 rounded-full border border-sage-200 px-3 text-sm font-semibold"
                >
                  Flag
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
