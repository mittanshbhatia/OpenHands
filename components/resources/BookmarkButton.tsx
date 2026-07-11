"use client";

import { Bookmark } from "lucide-react";
import clsx from "clsx";
import type { Resource } from "@/types";
import { useSaved } from "@/lib/saved/local-saved";

/** Bookmark any listing — appears under Bookmarked places on Saved. */
export function BookmarkButton({
  resource,
  className,
  compact = false,
}: {
  resource: Resource;
  className?: string;
  compact?: boolean;
}) {
  const { ids, toggleSave } = useSaved();
  const saved = ids.includes(resource.id);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave(resource);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove bookmark for ${resource.name}` : `Bookmark ${resource.name}`}
      className={clsx(
        compact
          ? "flex shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold transition hover:bg-sage-100"
          : "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition",
        saved
          ? compact
            ? "text-coral-600"
            : "border-coral-400 bg-coral-50 text-coral-700"
          : compact
            ? "text-teal-800"
            : "border-sage-200 bg-white text-teal-800 hover:bg-sage-50",
        className,
      )}
    >
      {compact ? (
        <>
          <span
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-full border bg-white",
              saved ? "border-coral-400 text-coral-600" : "border-[#dadce0] text-teal-800",
            )}
          >
            <Bookmark className={clsx("h-4 w-4", saved && "fill-current")} aria-hidden />
          </span>
          {saved ? "Saved" : "Save"}
        </>
      ) : (
        <>
          <Bookmark className={clsx("h-4 w-4", saved && "fill-current")} aria-hidden />
          {saved ? "Bookmarked" : "Bookmark"}
        </>
      )}
    </button>
  );
}
