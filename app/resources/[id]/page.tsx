import Link from "next/link";
import { notFound } from "next/navigation";
import { getResourceById, searchResources } from "@/lib/matching/resources";
import { CATEGORY_LABELS } from "@/lib/demo/seed";
import { ResourceActions } from "@/components/resources/ResourceActions";
import { ResourceDetailMap } from "@/components/maps/ResourceDetailMap";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = getResourceById(id);
  if (!resource) notFound();

  const similar = searchResources({
    category: resource.category,
    origin: { lat: resource.latitude, lng: resource.longitude },
  })
    .filter((r) => r.id !== resource.id)
    .slice(0, 3);

  const mapsUrl = `https://www.openstreetmap.org/directions?from=&to=${resource.latitude}%2C${resource.longitude}`;

  return (
    <article className="space-y-6 pb-10">
      <Link href="/find-help" className="text-sm font-semibold text-teal-700 hover:underline">
        ← Back to Find Help
      </Link>
      <header className="rounded-3xl border border-sage-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
          {CATEGORY_LABELS[resource.category]}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-teal-900">{resource.name}</h1>
        <p className="mt-2 text-teal-800/80">{resource.description}</p>
        <p className="mt-4 rounded-2xl bg-cream-100 px-4 py-3 text-sm text-teal-900">
          Availability can change. OpenHands does not guarantee a bed, meal, or service will be open when
          you arrive. Please contact the provider when you can.
        </p>
        <div className="mt-5">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center rounded-full bg-coral-500 px-6 text-sm font-semibold text-white hover:bg-coral-600"
          >
            Get Directions
          </a>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-sage-200 bg-white p-5">
          <h2 className="font-semibold">Details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-teal-800/60">Address</dt>
              <dd>
                {resource.address}, {resource.city}, {resource.state} {resource.postalCode}
              </dd>
            </div>
            <div>
              <dt className="text-teal-800/60">Hours</dt>
              <dd>{resource.hours}</dd>
            </div>
            <div>
              <dt className="text-teal-800/60">Phone</dt>
              <dd>{resource.phone ?? "Not listed"}</dd>
            </div>
            <div>
              <dt className="text-teal-800/60">Last confirmed</dt>
              <dd>{resource.lastVerifiedAt}</dd>
            </div>
            <div>
              <dt className="text-teal-800/60">Verification</dt>
              <dd>{resource.verificationStatus.replaceAll("_", " ")}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-sage-200 bg-white p-5">
          <h2 className="font-semibold">Services & access</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {resource.essentials.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <strong>Eligibility:</strong> {resource.eligibility}
          </p>
          <p className="mt-2 text-sm">
            <strong>Accessibility:</strong> {resource.accessibility}
          </p>
          <p className="mt-2 text-sm">
            <strong>Languages:</strong> {resource.languages.join(", ")}
          </p>
        </div>
      </section>

      <ResourceActions resourceId={resource.id} name={resource.name} />

      <ResourceDetailMap resource={resource} />

      <section>
        <h2 className="text-xl font-semibold">Similar nearby</h2>
        <ul className="mt-3 space-y-2">
          {similar.map((r) => (
            <li key={r.id}>
              <Link className="font-medium text-teal-700 hover:underline" href={`/resources/${r.id}`}>
                {r.name}
              </Link>{" "}
              <span className="text-sm text-teal-800/70">({r.distanceMiles} mi)</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
