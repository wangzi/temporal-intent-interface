// GET /resume.json — the machine-readable resume.
//
// Served from the SAME parsed `resume` object that renders /resume and the
// JSON-LD, so an agent, a crawler and a human cannot be shown different facts.
// Static and public: no auth, no engine call, no private contact data.

import { resume } from "@/lib/resume/data";
import { assertNoPrivateContact } from "@/lib/resume/schemas";

export const dynamic = "force-static";

export function GET(): Response {
  const body = {
    version: resume.version,
    canonical: "https://z.stillinlove.co/resume",
    // Lets a consumer detect that a transcription changed upstream.
    sourceSha256: resume.sourceSha256,
    person: {
      name: resume.person.name,
      headline: resume.person.headline,
      summary: resume.person.summary,
      location: resume.person.location,
      links: { linkedin: resume.person.linkedin },
    },
    experience: resume.experience.map((entry) => ({
      id: entry.id,
      organization: entry.organization,
      location: entry.location,
      startYear: entry.startYear,
      endYear: entry.endYear,
      positions: entry.positions.map((position) => ({
        id: position.id,
        ...(position.role ? { role: position.role } : {}),
        ...(position.team ? { team: position.team } : {}),
        startYear: position.startYear,
        endYear: position.endYear,
        claims: position.claims,
      })),
    })),
    education: resume.education,
    workPlay: resume.workPlay,
  };

  // The endpoint re-checks rather than trusting the caller chain.
  assertNoPrivateContact(body);

  return Response.json(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
