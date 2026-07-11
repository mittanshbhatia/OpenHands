import Image from "next/image";
import clsx from "clsx";

type Props = {
  className?: string;
  /** Show “Open Hands” wordmark beside the icon */
  withWordmark?: boolean;
  /** Soft-fade the hard bottom edge of the mark */
  softEdge?: boolean;
};

export function OpenHandsLogo({
  className = "h-10 w-10",
  withWordmark = false,
  softEdge = true,
}: Props) {
  return (
    <span className={clsx("inline-flex items-center gap-3", withWordmark && "min-h-12")}>
      <span
        className={clsx("relative inline-flex shrink-0 overflow-hidden", className)}
        style={
          softEdge
            ? {
                WebkitMaskImage:
                  "linear-gradient(to bottom, #000 0%, #000 72%, rgba(0,0,0,0.65) 88%, transparent 100%)",
                maskImage:
                  "linear-gradient(to bottom, #000 0%, #000 72%, rgba(0,0,0,0.65) 88%, transparent 100%)",
              }
            : undefined
        }
      >
        <Image
          src="/logo.png"
          alt={withWordmark ? "" : "OpenHands"}
          width={96}
          height={96}
          className="h-full w-full object-contain"
          priority
        />
      </span>
      {withWordmark ? (
        <span className="font-sans text-xl font-semibold tracking-tight sm:text-2xl">
          <span className="text-teal-900">Open</span>
          <span className="text-coral-500"> Hands</span>
        </span>
      ) : null}
    </span>
  );
}
