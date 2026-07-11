import clsx from "clsx";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Tailwind max-height utility, e.g. max-h-[620px] */
  maxHeightClass?: string;
  /** Page cream used for fade overlays */
  fadeColor?: string;
};

/**
 * Scrollable list with soft top/bottom shade instead of a hard clip.
 */
export function ShadedScroll({
  children,
  className,
  maxHeightClass = "max-h-[620px]",
  fadeColor = "#f4eee3",
}: Props) {
  return (
    <div className={clsx("relative min-h-0", className)}>
      <div
        className={clsx("no-scrollbar space-y-3 overflow-y-auto py-4", maxHeightClass)}
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 28px, #000 calc(100% - 28px), transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 28px, #000 calc(100% - 28px), transparent 100%)",
        }}
      >
        {children}
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-10"
        style={{
          background: `linear-gradient(to bottom, ${fadeColor} 0%, transparent 100%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-10"
        style={{
          background: `linear-gradient(to top, ${fadeColor} 0%, transparent 100%)`,
        }}
        aria-hidden
      />
    </div>
  );
}
