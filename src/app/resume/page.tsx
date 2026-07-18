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
import { redirect } from "next/navigation";

import { Footer } from "@/components/reader/Footer";
import { ResumeAskAi } from "@/components/resume/ResumeAskAi";
import { RoleNav } from "@/components/resume/RoleNav";
import { JsonLd } from "@/components/seo/JsonLd";
import { resume } from "@/lib/resume/data";
import { resumeJsonLd } from "@/lib/resume/jsonld";
import {
  ROLE_VIEWS,
  applyRole,
  claimCount,
  isInvalidRoleParam,
  parseRole,
} from "@/lib/resume/roles";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const role = parseRole((await searchParams).role);

  return {
    title: role
      ? `${resume.person.name} — Resume · ${ROLE_VIEWS[role].label}`
      : `${resume.person.name} — Resume`,
    description: resume.person.headline,
    // The canonical is /resume for every view. A role view is a re-emphasis of
    // one document, not a second document — pointing them all here is what
    // keeps them from competing with the record in search.
    alternates: { canonical: "/resume" },
    // Follow the links (the full record is reachable from here) but keep the
    // filtered views out of the index.
    robots: role ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${resume.person.name} — Resume`,
      description: resume.person.headline,
      url: "/resume",
      type: "profile",
    },
  };
}

/** "2023 — Present" / "2008 — 2013" — year granularity only, by policy. */
function span(startYear: number, endYear: number | "Present"): string {
  return `${startYear} — ${endYear}`;
}

export default async function ResumePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  // An unparseable ?role= is sent to the canonical record rather than rendered
  // as an empty or guessed view. Covers unknown ids, case mutations, empty
  // values and repeated parameters.
  if (isInvalidRoleParam(params.role)) redirect("/resume");

  const role = parseRole(params.role);
  const view = role ? ROLE_VIEWS[role] : null;
  // The lens selects and reorders claims. Everything rendered below is the
  // same text either way — see lib/resume/roles.ts.
  const active = view ? applyRole(resume, view) : resume;
  const { person, experience, education, workPlay } = active;

  return (
    <>
      {/* Structured data always describes the full record, never a lens. */}
      <JsonLd data={resumeJsonLd()} />
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

        {/* Plain server-rendered links — role views work with JS disabled. */}
        <RoleNav active={role} />

        {view ? (
          // Says plainly what the reader is looking at, and what it isn't. A
          // filtered resume that doesn't announce itself is a misleading one.
          <p className="resume-lens-note mono" data-text-origin="generated">
            Filtered view: {claimCount(active)} of {claimCount(resume)} claims,
            reordered. {view.note} No wording is changed —{" "}
            <a className="resume-link" href="/resume">
              see the full record
            </a>
            .
          </p>
        ) : null}

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
      {/* Mounted outside <main id="resume-main"> on purpose: it reads that
          element's innerText, so keeping it a sibling guarantees its own dot
          and panel labels never end up in what gets copied. */}
      <ResumeAskAi />
      <Footer />
    </>
  );
}
