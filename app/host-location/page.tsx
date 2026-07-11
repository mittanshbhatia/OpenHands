"use client";

import Link from "next/link";
import { useState } from "react";
import { useSaved } from "@/lib/saved/local-saved";

export default function HostLocationPage() {
  const { addHostLocation, hostLocations } = useSaved();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("");
  const [capacity, setCapacity] = useState("");
  const [phone, setPhone] = useState("");
  const [published, setPublished] = useState(false);

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">Host a donation location</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          Publish a real drop-off point with your real address and phone. Saved on this device.
        </p>
      </header>

      <section className="rounded-3xl border border-sage-200 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold">Create location</h2>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            addHostLocation({
              name: name.trim(),
              address: address.trim(),
              phone: phone.trim(),
              hours: hours.trim(),
              capacity: capacity.trim(),
            });
            setPublished(true);
          }}
        >
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Location name"
            className="min-h-11 rounded-xl border border-sage-200 px-3"
          />
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full street address"
            className="min-h-11 rounded-xl border border-sage-200 px-3"
          />
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone donors can call"
            type="tel"
            className="min-h-11 rounded-xl border border-sage-200 px-3 md:col-span-2"
          />
          <label className="block text-sm md:col-span-2">
            Hours
            <input
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Mon–Fri 10:00 AM to 4:00 PM"
              className="mt-1 min-h-11 w-full rounded-xl border border-sage-200 px-3"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            Capacity
            <input
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="20 bags / day"
              className="mt-1 min-h-11 w-full rounded-xl border border-sage-200 px-3"
            />
          </label>
          <button
            type="submit"
            className="min-h-11 rounded-full bg-teal-700 px-5 text-sm font-semibold text-white md:col-span-2"
          >
            Save on this device
          </button>
        </form>
        {published ? (
          <p className="mt-4 rounded-2xl bg-cream-100 px-4 py-3 text-sm text-teal-800">
            Saved: {name} at {address}. Phone {phone}. Hours {hours}. Capacity {capacity}.
          </p>
        ) : null}
      </section>

      {hostLocations.length ? (
        <section>
          <h2 className="text-xl font-semibold">Your hosted locations</h2>
          <ul className="mt-3 space-y-2">
            {hostLocations.map((h) => (
              <li key={h.id} className="rounded-2xl border border-sage-200 bg-white p-4 text-sm">
                <p className="font-semibold text-teal-900">{h.name}</p>
                <p className="text-teal-800/80">{h.address}</p>
                <p className="text-teal-800/70">
                  {h.phone} · {h.hours} · {h.capacity}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-sm text-teal-800/70">
        <Link href="/saved" className="font-semibold underline">
          View Saved
        </Link>{" "}
        for bookmarks and directions.
      </p>
    </div>
  );
}
