"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function FindHelpNearMeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      router.push("/find-help");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        router.push(`/find-help?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
      },
      () => {
        router.push("/find-help");
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral-500 px-5 text-sm font-semibold text-white hover:bg-coral-600 disabled:opacity-75"
    >
      {loading ? "Locating..." : "Find Help Near Me"} <ArrowRight className="h-4 w-4" aria-hidden />
    </button>
  );
}
