"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { communityNeeds, donationLocations } from "@/lib/demo/seed";
import { classifyDonationText } from "@/lib/ai/assistant";
import { explainDonationMatch } from "@/lib/matching/resources";
import { useAuth } from "@/lib/auth/demo-auth";

const paths = [
  { href: "/give-help#donate", title: "Donate items", body: "Food, clothing, hygiene, and more." },
  { href: "/give-help#donate", title: "Donate funds", body: "Support verified community needs." },
  { href: "/community", title: "Volunteer time", body: "See open shifts nearby." },
  { href: "/community", title: "Offer transportation", body: "Help move donations safely." },
  { href: "/host-location", title: "Host a donation location", body: "Open a drop-off point." },
  { href: "/community", title: "Organize a donation drive", body: "Coordinate a weekend collection." },
  { href: "/give-help#add-resource", title: "Add a community resource", body: "Share a known service." },
  { href: "/community", title: "Respond to an urgent need", body: "Fill critical gaps today." },
];

export default function GiveHelpPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [itemText, setItemText] = useState("12 clean winter jackets");
  const [classification, setClassification] = useState<Awaited<ReturnType<typeof classifyDonationText>> | null>(
    null,
  );
  const [selectedNeed, setSelectedNeed] = useState(communityNeeds[0]?.id ?? "");
  const [confirmed, setConfirmed] = useState(false);

  const matches = useMemo(() => {
    return communityNeeds
      .filter((n) => !classification || n.category.includes(classification.category.split(" ")[0].toLowerCase()) || n.category === "clothing")
      .map((n) => ({
        need: n,
        location: donationLocations.find((d) => d.status === "active") ?? donationLocations[0],
        reason: explainDonationMatch({
          category: classification?.category ?? n.category,
          distanceMiles: 1.2,
          urgency: n.urgency,
          remaining: Math.max(0, n.requestedQuantity - n.fulfilledQuantity),
          locationName: n.orgName,
        }),
      }));
  }, [classification]);

  async function classify() {
    const result = await classifyDonationText(itemText);
    setClassification(result);
    setStep(3);
  }

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-3xl font-semibold">Give Help</h1>
        <p className="mt-1 text-sm text-teal-800/80">
          Choose how you want to contribute. Demo mode keeps everything local in your browser.
        </p>
        {!user ? (
          <p className="mt-3 rounded-2xl bg-cream-100 px-4 py-3 text-sm">
            You can explore freely. <Link className="font-semibold underline" href="/profile">Sign in</Link> to
            save donation history across sessions.
          </p>
        ) : null}
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {paths.map((p) => (
          <Link key={p.title} href={p.href} className="rounded-2xl border border-sage-200 bg-white p-4 shadow-soft">
            <div className="font-semibold text-teal-900">{p.title}</div>
            <p className="mt-1 text-sm text-teal-800/75">{p.body}</p>
          </Link>
        ))}
      </section>

      <section id="donate" className="rounded-3xl border border-sage-200 bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-semibold">Donate items</h2>
        <p className="mt-1 text-sm text-teal-800/80">Multi-step demo workflow with AI classification fallback.</p>
        <div className="mt-4 flex gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`rounded-full px-3 py-1 ${step === n ? "bg-teal-700 text-white" : "bg-sage-100"}`}>
              Step {n}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-medium" htmlFor="items">
              What would you like to donate?
            </label>
            <textarea
              id="items"
              value={itemText}
              onChange={(e) => setItemText(e.target.value)}
              className="min-h-28 w-full rounded-2xl border border-sage-200 p-3 text-sm"
            />
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-11 rounded-full bg-teal-700 px-4 text-sm font-semibold text-white"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-3">
            <p className="text-sm">Add details, then classify with the OpenHands assistant.</p>
            <button
              type="button"
              onClick={() => void classify()}
              className="min-h-11 rounded-full bg-coral-500 px-4 text-sm font-semibold text-white"
            >
              Classify & find matches
            </button>
          </div>
        )}

        {step === 3 && classification && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-cream-100 p-4 text-sm">
              <div>
                <strong>Category:</strong> {classification.category}
              </div>
              <div>
                <strong>Quantity:</strong> {classification.quantity}
              </div>
              <div>
                <strong>Safety:</strong> {classification.safetyNote}
              </div>
            </div>
            <h3 className="font-semibold">Recommended matches</h3>
            <ul className="space-y-3">
              {matches.map((m) => (
                <li key={m.need.id} className="rounded-2xl border border-sage-200 p-4">
                  <label className="flex cursor-pointer gap-3">
                    <input
                      type="radio"
                      name="need"
                      checked={selectedNeed === m.need.id}
                      onChange={() => setSelectedNeed(m.need.id)}
                    />
                    <span>
                      <span className="block font-semibold">{m.need.title}</span>
                      <span className="block text-sm text-teal-800/80">{m.reason}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={classification.unsuitable}
              onClick={() => {
                setConfirmed(true);
                setStep(4);
              }}
              className="min-h-11 rounded-full bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Confirm drop-off
            </button>
          </div>
        )}

        {step === 4 && confirmed && (
          <div className="mt-5 rounded-2xl bg-teal-700 p-5 text-cream-50">
            <h3 className="text-xl font-semibold">Donation scheduled (demo)</h3>
            <p className="mt-2 text-sm text-cream-100/90">
              This is a demonstration confirmation — not a tax receipt. Bring items during posted hours and
              check in with staff if present.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              <li>Drop-off window: next open host hours</li>
              <li>Optional anonymous mode available at check-in</li>
              <li>Add a calendar reminder from your device calendar</li>
            </ul>
          </div>
        )}
      </section>

      <section id="add-resource" className="rounded-2xl border border-sage-200 bg-white p-5">
        <h2 className="text-xl font-semibold">Add a community resource</h2>
        <p className="mt-1 text-sm text-teal-800/80">
          Submissions are marked community-submitted until a moderator verifies them.
        </p>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Thank you. Your community resource was submitted for review (demo).");
          }}
        >
          <input required placeholder="Resource name" className="min-h-11 rounded-xl border border-sage-200 px-3" />
          <input required placeholder="Address" className="min-h-11 rounded-xl border border-sage-200 px-3" />
          <textarea
            required
            placeholder="What services are offered?"
            className="min-h-24 rounded-xl border border-sage-200 px-3 py-2 md:col-span-2"
          />
          <button type="submit" className="min-h-11 rounded-full bg-teal-700 px-4 text-sm font-semibold text-white md:col-span-2">
            Submit for review
          </button>
        </form>
      </section>
    </div>
  );
}
