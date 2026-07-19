// A single case.
//
// Note what this page does NOT do: it never renders a number that lives here.
// Metrics come from `evidenceFor()`, which resolves resume claim ids against
// the record, so every figure on this page is the same string verify:source
// proved against the source PDF.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/reader/Footer";
import { ArtifactFrame } from "@/components/work/ArtifactFrame";
import { work, findCase } from "@/lib/work/data";
import { evidenceFor, locationFor, periodFor } from "@/lib/work/evidence";

export function generateStaticParams() {
  return work.cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const workCase = findCase((await params).slug);
  if (!workCase) return {};
  return {
    title: `${workCase.title} — Work — Zi Wang`,
    alternates: { canonical: `/work/${workCase.slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function WorkCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const workCase = findCase((await params).slug);
  if (!workCase) notFound();

  const evidence = evidenceFor(workCase);
  const period = periodFor(workCase);
  const location = locationFor(workCase);

  return (
    <>
      <main className="work work-case" id="work-main">
        <p className="work-back mono">
          <Link className="resume-link" href="/work">
            ← work
          </Link>
        </p>

        <header className="work-case-head">
          <h1 className="work-title">{workCase.title}</h1>
          {period ? (
            <p className="work-case-when mono">
              {period}
              {location ? (
                <>
                  <span aria-hidden="true"> · </span>
                  {location}
                </>
              ) : null}
            </p>
          ) : null}
          {workCase.status === "draft" ? (
            // Said plainly rather than hidden. A case with no story yet should
            // announce that, not imply the work was thin.
            <p className="work-draft-note mono" data-text-origin="generated">
              Draft — the write-up for this one isn&rsquo;t written yet. The
              verified claims below are from the record.
            </p>
          ) : null}
        </header>

        {workCase.narrative.length > 0 ? (
          <div className="work-narrative prose">
            {workCase.narrative.map((paragraph, i) => (
              <p key={i} data-text-origin="canonical">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}

        {workCase.artifacts.length > 0 ? (
          <section className="work-section" aria-labelledby="work-artifacts">
            <h2 className="work-section-title mono" id="work-artifacts">
              Interactive
            </h2>
            {workCase.artifacts.map((artifact) => (
              <ArtifactFrame key={artifact.src} artifact={artifact} />
            ))}
          </section>
        ) : null}

        {workCase.media.length > 0 ? (
          <section className="work-section" aria-labelledby="work-media">
            <h2 className="work-section-title mono" id="work-media">
              Media
            </h2>
            {workCase.media.map((item) => (
              <figure className="work-media" key={item.src}>
                {/* Plain <img>: these are self-hosted static assets with known
                    intrinsic dimensions, and next/image would add a loader for
                    no benefit here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="work-media-img"
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  loading="lazy"
                />
                {item.caption ? (
                  <figcaption className="work-media-caption mono">
                    {item.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </section>
        ) : null}

        <section className="work-section" aria-labelledby="work-evidence">
          <h2 className="work-section-title mono" id="work-evidence">
            On the record
          </h2>
          <ul className="work-evidence prose">
            {evidence.map((claim) => (
              <li
                key={claim.id}
                id={`claim-${claim.id}`}
                data-claim-id={claim.id}
                // Canonical: this is the resume's own text, resolved by id,
                // not a retelling written for this page.
                data-text-origin="canonical"
              >
                {claim.text}
              </li>
            ))}
          </ul>
          <p className="work-evidence-note mono" data-text-origin="generated">
            Rendered from the resume record, not restated here.
          </p>
        </section>

        {workCase.links.length > 0 ? (
          <section className="work-section" aria-labelledby="work-links">
            <h2 className="work-section-title mono" id="work-links">
              Elsewhere
            </h2>
            <ul className="work-links mono">
              {workCase.links.map((link) => (
                <li key={link.href}>
                  <a
                    className="resume-link"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
