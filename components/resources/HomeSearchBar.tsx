"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { exploreChooseHref } from "@/lib/maps/nav-links";

export function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/find-help");
  };

  const handleAutoLocate = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      router.push("/find-help");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: query.trim() || "Your location",
        };
        try {
          sessionStorage.setItem("openhands.lastOrigin", JSON.stringify(next));
        } catch {
          /* ignore */
        }
        router.push(exploreChooseHref(next));
      },
      () => {
        router.push("/find-help");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <form
      onSubmit={handleSearch}
      className="group relative mt-8 flex max-w-md items-center gap-1 rounded-full bg-white p-1 shadow-soft ring-1 ring-sage-200 transition-colors hover:bg-transparent hover:shadow-none hover:ring-transparent focus-within:bg-transparent focus-within:shadow-none focus-within:ring-transparent"
    >
      <div className="flex flex-1 items-center rounded-full bg-white transition-all group-hover:shadow-soft group-hover:ring-1 group-hover:ring-sage-200 group-focus-within:shadow-soft group-focus-within:ring-2 group-focus-within:ring-teal-600">
        <label className="sr-only" htmlFor="home-location">
          City, address, or ZIP
        </label>
        <button
          type="button"
          onClick={handleAutoLocate}
          disabled={loading}
          className="ml-2 flex min-h-11 min-w-11 items-center justify-center rounded-full text-teal-700 transition hover:bg-sage-100 disabled:opacity-50"
          aria-label="Use my location"
        >
          <MapPin className="h-4 w-4" />
        </button>
        <input
          id="home-location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="City, address, or ZIP"
          className="peer min-h-11 w-full bg-transparent px-2 text-sm text-teal-900 outline-none placeholder:text-sage-400"
        />
      </div>
      <button
        type="submit"
        className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-full bg-teal-700 text-white shadow-sm transition hover:bg-teal-600 group-hover:shadow-md group-focus-within:shadow-md"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>
    </form>
  );
}
