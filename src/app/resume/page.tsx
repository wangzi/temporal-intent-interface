// The resume surface. A second top-level surface, deliberately NOT built on the
// reader shell:
//
//   - No TemporalLayout: its grid is reader-specific (fixed-TopBar top padding,
//     ~66ch column cap) and it renders rail chrome this page has no use for.
//   - No ReaderControlsIsland: it hijacks scroll, binds Enter to /post/{slug}
//     and drives a focus-line reveal. Actively hostile here.
//   - No LensRail / Selection / snapshot / auth: the resume has no dependency on
//     Lens, and must keep none.
//
// It follows the /s/[token] precedent: a bare <main> plus the shared token,
// base and prose layers. Long-form copy uses `.prose` so headings, lists, links
// and code get the same typography as the reader without inheriting its layout.

import type { Metadata } from "next";

import { Footer } from "@/components/reader/Footer";
import { resume } from "@/lib/resume/data";

export const metadata: Metadata = {
  title: `${resume.person.name} — Resume`,
  description: resume.person.headline,
  // Explicit: the root layout intentionally sets no canonical, so every route
  // owns its own. Role views (?role=) also canonicalize here.
  alternates: { canonical: "/resume" },
};

/** "2023 — Present" / "2008 — 2013" — year granularity only, by policy. */
function span(startYear: number, endYear: number | "Present"): string {
  return `${startYear} — ${endYear}`;
}

export default function ResumePage() {
  const { person, experience, education, workPlay } = resume;

  return (
    <>
      <main className="resume" id="resume-main">
        <header className="resume-head">
          <h1 className="resume-name">{person.name}</h1>
          <p className="resume-headline" data-text-origin="canonical">
            {person.headline}
          </p>
          <p className="resume-meta mono">
            <span>{person.location}</span>
            <span aria-hidden="true"> · </span>
            <a
              className="resume-link"
              href={person.linkedin}
              target="_blank"
              rel="me noopener noreferrer"
            >
              LinkedIn
              <span className="resume-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </p>
          <div className="resume-summary prose">
            {person.summary.map((paragraph, i) => (
              <p key={i} className="resume-claim" data-text-origin="canonical">
                {paragraph}
              </p>
            ))}
          </div>
        </header>

        <section className="resume-section" aria-labelledby="resume-experience">
          <h2 className="resume-section-title mono" id="resume-experience">
            Experience
          </h2>
          {experience.map((entry) => (
            <article className="resume-entry" key={entry.id}>
              <header className="resume-entry-head">
                <h3 className="resume-org">{entry.organization}</h3>
                <p className="resume-when mono">
                  <time dateTime={String(entry.startYear)}>
                    {span(entry.startYear, entry.endYear)}
                  </time>
                  <span aria-hidden="true"> · </span>
                  <span>{entry.location}</span>
                </p>
              </header>

              {entry.positions.map((position) => (
                <div className="resume-position" key={position.id}>
                  {position.role ? (
                    <h4 className="resume-role">
                      {position.role}
                      {position.team ? (
                        <span className="resume-team"> · {position.team}</span>
                      ) : null}
                      <span className="resume-role-when mono">
                        {span(position.startYear, position.endYear)}
                      </span>
                    </h4>
                  ) : null}
                  <ul className="resume-claims prose">
                    {position.claims.map((claim) => (
                      <li
                        key={claim.id}
                        id={`claim-${claim.id}`}
                        className="resume-claim"
                        data-claim-id={claim.id}
                        data-text-origin="canonical"
                      >
                        {claim.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </article>
          ))}
        </section>

        <section className="resume-section" aria-labelledby="resume-education">
          <h2 className="resume-section-title mono" id="resume-education">
            Education
          </h2>
          <ul className="resume-education prose">
            {education.map((item) => (
              <li
                key={item.id}
                className="resume-claim"
                data-text-origin="canonical"
              >
                <strong>{item.institution}</strong> — {item.credential}{" "}
                <span className="mono resume-when-inline">({item.years})</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="resume-section" aria-labelledby="resume-work-play">
          <h2 className="resume-section-title mono" id="resume-work-play">
            Work + Play
          </h2>
          <ul className="resume-claims prose">
            {workPlay.map((claim) => (
              <li
                key={claim.id}
                id={`claim-${claim.id}`}
                className="resume-claim"
                data-claim-id={claim.id}
                data-text-origin="canonical"
              >
                {claim.text}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
