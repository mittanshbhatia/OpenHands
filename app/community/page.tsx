"use client";

import Link from "next/link";
import { communityNeeds, volunteerOpportunities, CATEGORY_LABELS } from "@/lib/demo/seed";

export default function CommunityPage() {
  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">Community</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          Urgent needs, volunteer shifts, and ways neighbors can show up for each other.
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold">Urgent community needs</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {communityNeeds.map((need) => (
            <li key={need.id} className="rounded-2xl border border-sage-200 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-teal-900">{need.title}</h3>
                <span className="rounded-full bg-coral-500/10 px-2 py-0.5 text-xs font-semibold uppercase text-coral-600">
                  {need.urgency}
                </span>
              </div>
              <p className="mt-2 text-sm text-teal-800/80">{need.description}</p>
              <p className="mt-3 text-sm">
                <strong>{need.orgName}</strong> · {need.requestedQuantity - need.fulfilledQuantity} still needed ·{" "}
                {CATEGORY_LABELS[need.category] ?? need.category}
              </p>
              <Link
                href="/give-help#donate"
                className="mt-4 inline-flex min-h-11 items-center rounded-full bg-teal-700 px-4 text-sm font-semibold text-white"
              >
                Help fill this need
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Volunteer opportunities</h2>
        <ul className="mt-4 space-y-3">
          {volunteerOpportunities.map((v) => (
            <li key={v.id} className="rounded-2xl border border-sage-200 bg-white p-5">
              <h3 className="font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-teal-800/80">{v.description}</p>
              <p className="mt-2 text-sm">
                {v.orgName} · {new Date(v.startTime).toLocaleString()} ·{" "}
                {v.volunteersNeeded - v.volunteersRegistered} spots open · {v.location}
              </p>
              <button
                type="button"
                onClick={() => alert("Signed up for this demo shift. Check your Profile for reminders.")}
                className="mt-3 min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold"
              >
                Sign up (demo)
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
