"use client";

import Link from "next/link";
import { useState } from "react";
import { donationLocations } from "@/lib/demo/seed";
import { useAuth } from "@/lib/auth/demo-auth";

export default function HostLocationPage() {
  const { user } = useAuth();
  const [hours, setHours] = useState("Sat–Sun 10:00 AM – 4:00 PM");
  const [capacity, setCapacity] = useState("40 bags / day");
  const [published, setPublished] = useState(false);

  const myLocations = donationLocations;

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">Host a donation location</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          Open a drop-off point, set hours, and publish capacity for donors in the neighborhood.
        </p>
        {!user || (user.role !== "host" && user.role !== "admin") ? (
          <p className="mt-3 rounded-2xl bg-cream-100 px-4 py-3 text-sm">
            Sign in as <strong>host@demo.openhands</strong> for the full host flow.{" "}
            <Link className="font-semibold underline" href="/profile">
              Profile
            </Link>
          </p>
        ) : null}
      </header>

      <section className="rounded-3xl border border-sage-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold">Create / update location</h2>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPublished(true);
          }}
        >
          <input
            required
            defaultValue="Harbor Bridge Drop-Off"
            placeholder="Location name"
            className="min-h-11 rounded-xl border border-sage-200 px-3"
          />
          <input
            required
            defaultValue="88 Harbor Rd, San Francisco, CA"
            placeholder="Address"
            className="min-h-11 rounded-xl border border-sage-200 px-3"
          />
          <label className="block text-sm md:col-span-2">
            Hours
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-sage-200 px-3"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            Capacity
            <input
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-sage-200 px-3"
            />
          </label>
          <button type="submit" className="min-h-11 rounded-full bg-teal-700 px-4 text-sm font-semibold text-white md:col-span-2">
            Publish location (demo)
          </button>
        </form>
        {published ? (
          <p className="mt-4 rounded-2xl bg-teal-700/10 px-4 py-3 text-sm text-teal-900">
            Published locally for this session: {hours}, capacity {capacity}.
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Active donation locations</h2>
        <ul className="mt-4 space-y-3">
          {myLocations.map((loc) => (
            <li key={loc.id} className="rounded-2xl border border-sage-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{loc.name}</h3>
                <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-semibold uppercase">
                  {loc.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-teal-800/80">
                {loc.address} · {loc.hours}
              </p>
              <p className="mt-2 text-sm">Accepts: {loc.acceptedItems.join(", ")}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
