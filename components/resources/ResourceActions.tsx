"use client";

import { useSaved } from "@/lib/saved/local-saved";

export function ResourceActions({ resourceId, name }: { resourceId: string; name: string }) {
  const { ids, toggleSave, addToPlan } = useSaved();
  const saved = ids.includes(resourceId);

  return (
    <section className="rounded-2xl border border-sage-200 bg-white p-5">
      <h2 className="font-semibold">Actions</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggleSave(resourceId)}
          className="min-h-11 rounded-full bg-teal-700 px-4 text-sm font-semibold text-white"
        >
          {saved ? "Saved" : "Save resource"}
        </button>
        <button
          type="button"
          onClick={() => addToPlan(resourceId)}
          className="min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold"
        >
          Add to My Plan
        </button>
        <button
          type="button"
          onClick={async () => {
            const text = `OpenHands resource: ${name}`;
            if (navigator.share) await navigator.share({ title: name, text });
            else await navigator.clipboard.writeText(text);
          }}
          className="min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold"
        >
          Share
        </button>
        <button
          type="button"
          onClick={() => alert("Thank you. Moderators will review this demo report.")}
          className="min-h-11 rounded-full border border-sage-200 px-4 text-sm font-semibold"
        >
          Report outdated info
        </button>
      </div>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          alert("Thanks for the feedback.");
        }}
      >
        <fieldset>
          <legend className="text-sm font-medium">Was this information accurate?</legend>
          <div className="mt-2 flex gap-2">
            <button type="submit" className="min-h-11 rounded-full bg-sage-100 px-4 text-sm">
              Yes
            </button>
            <button type="submit" className="min-h-11 rounded-full bg-sage-100 px-4 text-sm">
              Needs update
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
