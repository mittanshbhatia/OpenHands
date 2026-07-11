import Image from "next/image";

export function OpenHandsLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <Image 
      src="/logo.png"
      alt="OpenHands logo"
      width={64}
      height={64}
      className={className}
    />
  );
}
