"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          OpenHands shows real Google Places worldwide. Review provider websites and call centers if a
          listing looks wrong.
        </p>
      </header>
      <div className="rounded-2xl border border-sage-200 bg-white p-5 text-sm text-teal-800">
        Use{" "}
        <Link href="/find-help" className="font-semibold underline">
          Find Help
        </Link>{" "}
        or{" "}
        <Link href="/explore" className="font-semibold underline">
          Explore
        </Link>{" "}
        to inspect live Places data near any location.
      </div>
    </div>
  );
}
