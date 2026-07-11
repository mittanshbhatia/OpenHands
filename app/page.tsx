import Link from "next/link";
import { ArrowRight, HeartHandshake, Search, ShieldCheck, Sparkles } from "lucide-react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { CATEGORY_LABELS, IMPACT_STATS, communityNeeds, resources } from "@/lib/demo/seed";
import { searchResources } from "@/lib/matching/resources";

export default function HomePage() {
  const nearby = searchResources({ origin: { lat: 37.7749, lng: -122.4194 }, openNow: true }).slice(0, 3);
  const urgent = communityNeeds.filter((n) => n.urgency === "urgent" || n.urgency === "critical");

  return (
    <div className="space-y-16 pb-10">
      <section className="grid items-center gap-10 rounded-3xl bg-gradient-to-br from-teal-700 via-teal-600 to-teal-900 px-6 py-12 text-cream-50 shadow-soft md:grid-cols-[1.2fr_0.8fr] md:px-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cream-100/80">OpenHands</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Essential help should never be hard to find.
          </h1>
          <p className="mt-4 max-w-xl text-base text-cream-100/90 md:text-lg">
            OpenHands bridges essential needs with people ready to help — connecting people experiencing
            homelessness with nearby meals, shelter, clothing, hygiene, care, and community support.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/find-help"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral-500 px-5 text-sm font-semibold text-white hover:bg-coral-600"
            >
              Find Help Near Me <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/give-help"
              className="inline-flex min-h-12 items-center rounded-full bg-white/10 px-5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/15"
            >
              Give or Donate
            </Link>
          </div>
          <form action="/find-help" className="mt-6 flex max-w-md gap-2">
            <label className="sr-only" htmlFor="home-location">
              City, address, or ZIP
            </label>
            <input
              id="home-location"
              name="q"
              placeholder="City, address, or ZIP (demo uses San Francisco)"
              className="min-h-12 w-full rounded-full border-0 bg-white px-4 text-sm text-teal-900 outline-none ring-2 ring-transparent focus:ring-coral-400"
            />
            <button
              type="submit"
              className="min-h-12 rounded-full bg-cream-50 px-4 text-sm font-semibold text-teal-800"
            >
              Search
            </button>
          </form>
        </div>
        <div className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center">
          <div className="absolute inset-6 rounded-full bg-coral-500/20 blur-2xl" aria-hidden />
          <svg viewBox="0 0 320 240" className="relative h-full w-full" role="img" aria-label="Two open hands forming a bridge between community resources and people">
            <path d="M40 150c20-40 60-50 90-20" stroke="#f4eee3" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M280 150c-20-40-60-50-90-20" stroke="#f08a6b" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M120 140c20 20 60 20 80 0" stroke="#d8f3e9" strokeWidth="8" fill="none" strokeLinecap="round" />
            <circle cx="160" cy="120" r="18" fill="#f4eee3" />
          </svg>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-teal-900">Browse essentials</h2>
        <p className="mt-1 text-sm text-teal-800/80">Respectful categories for urgent and everyday needs.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <Link
              key={key}
              href={`/find-help?category=${key}`}
              className="rounded-2xl border border-sage-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5"
            >
              <div className="text-sm font-semibold text-teal-800">{label}</div>
              <div className="mt-1 text-xs text-sage-500">View nearby options</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Open near you</h2>
            <p className="text-sm text-teal-800/80">Demo location: San Francisco Bay Area</p>
          </div>
          <Link href="/find-help" className="text-sm font-semibold text-teal-700 hover:underline">
            See all
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {nearby.map((r) => (
            <ResourceCard key={r.id} resource={r} distanceMiles={r.distanceMiles} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-sage-200 bg-white p-6 shadow-soft md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Urgent community needs</h2>
          <p className="mt-1 text-sm text-teal-800/80">Demonstration requests from sample organizations.</p>
          <ul className="mt-4 space-y-3">
            {urgent.map((n) => (
              <li key={n.id} className="rounded-2xl bg-cream-100 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-coral-600">{n.urgency}</div>
                <div className="font-semibold text-teal-900">{n.title}</div>
                <div className="text-sm text-teal-800/80">{n.orgName}</div>
              </li>
            ))}
          </ul>
          <Link href="/community" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            Open community board <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Ways to help today</h2>
          <div className="mt-4 grid gap-3">
            {[
              { href: "/give-help", title: "Donate items or funds", icon: HeartHandshake },
              { href: "/host-location", title: "Host a donation location", icon: ShieldCheck },
              { href: "/assistant", title: "Ask the OpenHands Assistant", icon: Sparkles },
              { href: "/find-help", title: "Share a resource with someone", icon: Search },
            ].map((item) => (
              <Link
                key={item.href + item.title}
                href={item.href}
                className="flex min-h-14 items-center gap-3 rounded-2xl border border-sage-200 px-4 hover:bg-cream-100"
              >
                <item.icon className="h-5 w-5 text-teal-700" aria-hidden />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Impact (demonstration data)</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Essentials matched", IMPACT_STATS.essentialsMatched],
            ["Donations coordinated", IMPACT_STATS.donationsCoordinated],
            ["Active resource locations", IMPACT_STATS.activeLocations],
            ["Community volunteers", IMPACT_STATS.communityVolunteers],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-2xl bg-teal-700 p-5 text-cream-50 shadow-soft">
              <div className="text-3xl font-semibold tabular-nums">{Number(value).toLocaleString()}</div>
              <div className="mt-1 text-sm text-cream-100/80">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-sage-200 bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-semibold">How OpenHands works</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["Find", "Search nearby essentials without creating an account."],
            ["Connect", "See verified details, hours, and directions."],
            ["Contribute", "Donate, volunteer, or host a drop-off point."],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-2xl bg-cream-100 p-5">
              <div className="text-sm font-semibold text-coral-600">Step {i + 1}</div>
              <div className="mt-1 text-lg font-semibold">{title}</div>
              <p className="mt-2 text-sm text-teal-800/80">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-teal-800/80">
          Trust signals matter: we distinguish verified listings, community submissions, and recently
          confirmed information. Availability can change — always contact a provider when you can.
        </p>
        <p className="mt-2 text-sm text-teal-800/70">
          Partner placeholders: Bayview Community Pantry · Harbor Bridge Collective · Care Corner Clinic
        </p>
      </section>

      <p className="text-center text-xs text-teal-800/60">
        Showing {resources.length} seeded demo resources for San Francisco.
      </p>
    </div>
  );
}
