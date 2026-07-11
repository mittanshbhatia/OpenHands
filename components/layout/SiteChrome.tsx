"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HandHeart,
  HeartHandshake,
  Home,
  Landmark,
  Search,
  UserRound,
  Bookmark,
} from "lucide-react";
import { OpenHandsLogo } from "@/components/brand/OpenHandsLogo";
import { useAuth } from "@/lib/auth/demo-auth";
import clsx from "clsx";

const nav = [
  { href: "/find-help", label: "Find Help", icon: Search },
  { href: "/give-help", label: "Give Help", icon: HandHeart },
  { href: "/community", label: "Community", icon: HeartHandshake },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-sage-200/80 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <OpenHandsLogo className="h-10 w-10" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "rounded-full px-3 py-2 text-sm font-medium transition",
                  pathname?.startsWith(item.href)
                    ? "bg-teal-700 text-white"
                    : "text-teal-900 hover:bg-sage-100",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="rounded-full px-3 py-2 text-sm font-medium text-teal-900 hover:bg-sage-100"
            >
              Admin
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/need-help-now"
              className="inline-flex min-h-11 items-center rounded-full bg-coral-500 px-4 text-sm font-semibold text-white shadow-soft hover:bg-coral-600"
            >
              I Need Help Now
            </Link>
            <Link
              href="/profile"
              className="hidden rounded-full border border-sage-200 px-3 py-2 text-sm text-teal-800 md:inline"
            >
              {user ? user.name.split(" ")[0] : "Sign in"}
            </Link>
          </div>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sage-200 bg-cream-50/95 backdrop-blur md:hidden"
        aria-label="Mobile primary"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex min-h-12 flex-col items-center justify-center rounded-xl text-[11px] font-medium",
                    active ? "bg-teal-700 text-white" : "text-teal-800",
                  )}
                >
                  <Icon className="mb-0.5 h-5 w-5" aria-hidden />
                  {item.label.split(" ")[0]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="h-16 md:hidden" aria-hidden />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-sage-200 bg-teal-900 text-cream-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <OpenHandsLogo />
            <div>
              <div className="text-lg font-semibold">OpenHands</div>
              <p className="mt-1 text-sm text-cream-100/80">
                OpenHands bridges essential needs with people ready to help.
              </p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-cream-100/70">Support</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/accessibility" className="hover:underline">
                Accessibility
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:underline">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/safety" className="hover:underline">
                Safety
              </Link>
            </li>
            <li>
              <Link href="/guidelines" className="hover:underline">
                Community guidelines
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-cream-100/70">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/find-help" className="hover:underline">
                Find Help
              </Link>
            </li>
            <li>
              <Link href="/give-help" className="hover:underline">
                Give Help
              </Link>
            </li>
            <li>
              <Link href="/host-location" className="hover:underline">
                Host a location
              </Link>
            </li>
            <li>
              <Link href="/assistant" className="hover:underline">
                Assistant
              </Link>
            </li>
          </ul>
        </div>
      </div>

    </footer>
  );
}

export function FloatingAssistant() {
  return (
    <Link
      href="/assistant"
      className="fixed bottom-20 right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-teal-700 px-4 text-sm font-semibold text-white shadow-soft hover:bg-teal-600 md:bottom-6"
      aria-label="Open OpenHands Assistant"
    >
      <Landmark className="h-4 w-4" aria-hidden />
      Assistant
    </Link>
  );
}

export function HomeIcon() {
  return <Home className="h-4 w-4" />;
}
