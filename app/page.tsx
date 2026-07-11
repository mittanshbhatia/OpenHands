import Link from "next/link";
import Image from "next/image";
import { ArrowRight, HeartHandshake, Search, ShieldCheck, Sparkles } from "lucide-react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { HomeSearchBar } from "@/components/resources/HomeSearchBar";
import { CATEGORY_LABELS, IMPACT_STATS, communityNeeds, resources } from "@/lib/demo/seed";
import { searchResources } from "@/lib/matching/resources";

export default function HomePage() {
  return (
    <div className="pb-10">
      <section className="grid items-center gap-10 rounded-3xl bg-white px-6 py-12 text-teal-900 shadow-soft md:grid-cols-[1.2fr_0.8fr] md:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">OpenHands</p>
          <h1 className="mt-3 max-w-xl text-3xl font-serif italic font-medium leading-tight tracking-tight md:text-5xl">
            Essential help should never be hard to find.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-teal-800 md:text-base">
            OpenHands bridges essential needs with people ready to help — connecting people experiencing
            homelessness with nearby meals, shelter, clothing, hygiene, care, and community support.
          </p>
          <HomeSearchBar />
        </div>
        <div className="relative mx-auto flex h-64 w-full max-w-sm items-center justify-center">

          <Image 
            src="/logo.png" 
            alt="OpenHands logo" 
            width={320} 
            height={240} 
            className="relative h-full w-full object-contain" 
            priority
          />
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-sage-200 bg-white p-6 shadow-soft">
        <h2 className="text-3xl font-serif italic font-medium text-teal-900">How OpenHands works</h2>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["Find", "Search nearby essentials without creating an account."],
            ["Connect", "See verified details, hours, and directions."],
            ["Contribute", "Donate, volunteer, or host a drop-off point."],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-2xl bg-cream-50 p-5">
              <div className="text-sm font-semibold text-coral-600">Step {i + 1}</div>
              <div className="mt-1 text-lg font-semibold text-teal-900">{title}</div>
              <p className="mt-2 text-sm text-teal-800">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
