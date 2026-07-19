// The work index. A list of cases, not a grid of thumbnails — this site's
// identity is typographic, and most cases have no imagery yet anyway.

import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/reader/Footer";
import { ArtifactFrame } from "@/components/work/ArtifactFrame";
import { publishedCases, work } from "@/lib/work/data";
import { evidenceFor, locationFor, periodFor } from "@/lib/work/evidence";
import type { Artifact } from "@/lib/work/types";

// Shown only while nothing is published, so it removes itself the moment real
// work lands. It exists so the embed path ships proven rather than theoretical:
// the demo runs JavaScript and then reports that it cannot reach the host's
// cookies, DOM or credentialed fetches. See public/work/README.md.
const EMBED_DEMO: Artifact = {
  src: "/work/artifacts/embed-demo/index.html",
  title: "Artifact embed demo",
  description:
    'A self-contained page framed with sandbox="allow-scripts". It runs its own JavaScript, and shows the host origin staying out of reach.',
  height: 420,
};

export const metadata: Metadata = {
  title: "Work — Zi Wang",
  description: "Selected work.",
  alternates: { canonical: "/work" },
  // Gated and unfinished; nothing here should be indexed yet.
  robots: { index: false, follow: false },
};

export default function WorkIndexPage() {
  return (
    <>
      <main className="work" id="work-main">
        <header className="work-head">
          <h1 className="work-title">Work</h1>
          <p className="work-lede" data-text-origin="generated">
            Cases behind the{" "}
            <Link className="resume-link" href="/resume">
              resume
            </Link>
            . Each one is evidence for specific claims on the record.
          </p>
        </header>

        <ul className="work-list">
          {work.cases.map((workCase) => {
            const period = periodFor(workCase);
            const location = locationFor(workCase);
            return (
              <li className="work-item" key={workCase.slug}>
                <Link
                  className="work-item-link"
                  href={`/work/${workCase.slug}`}
                >
                  <span className="work-item-title">{workCase.title}</span>
                  {period ? (
                    <span className="work-item-when mono">
                      {period}
                      {location ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          {location}
                        </>
                      ) : null}
                    </span>
                  ) : null}
                </Link>
                <p className="work-item-meta mono" data-text-origin="generated">
                  {workCase.status === "draft" ? (
                    <span className="work-draft-tag">draft</span>
                  ) : null}
                  <span>
                    {evidenceFor(workCase).length} claim
                    {evidenceFor(workCase).length === 1 ? "" : "s"}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>

        {publishedCases.length === 0 ? (
          <section className="work-section" aria-labelledby="work-embed-demo">
            <h2 className="work-section-title mono" id="work-embed-demo">
              Embedding artifacts
            </h2>
            <p className="work-lede" data-text-origin="generated">
              Cases can embed interactive artifacts. This one is a working
              example — see <code>public/work/README.md</code> to add your own.
              It disappears once a case is published.
            </p>
            <ArtifactFrame artifact={EMBED_DEMO} />
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
