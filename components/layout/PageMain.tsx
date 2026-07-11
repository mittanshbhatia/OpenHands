"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";

export function PageMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main
      id="main"
      className={clsx(
        "mx-auto min-h-[70vh]",
        isHome ? "max-w-none px-0 py-0" : "max-w-6xl px-4 py-6",
      )}
    >
      {children}
    </main>
  );
}
