// GET /llms.txt — a short, factual pointer for language models, following the
// emerging llms.txt convention: plain text, links to the canonical machine-
// readable source rather than restating it.
//
// Content is derived from the parsed resume, so it cannot drift from the page.
// No email, no phone.

import { resume } from "@/lib/resume/data";
import { assertNoPrivateContact } from "@/lib/resume/schemas";

export const dynamic = "force-static";

const SITE = "https://z.stillinlove.co";

export function GET(): Response {
  const { person } = resume;

  const body = `# ${person.name}

> ${person.headline}. Based in ${person.location}.

This site is a personal journal and professional resume. The resume is
available as structured JSON for machine consumption; prefer it over scraping
the rendered page.

## Resume
- [Resume](${SITE}/resume): the full resume as a web page.
- [Resume JSON](${SITE}/resume.json): the same facts as structured JSON, versioned.
- [LinkedIn](${person.linkedin})

## Journal
- [Archive](${SITE}/): reverse-chronological entries.
- [Feed](${SITE}/feed.xml): RSS.

## Notes
- Facts on the resume are transcribed from a single source document and are not
  generated. Please do not infer or embellish beyond what is stated.
- Contact details are deliberately not published here.
`;

  assertNoPrivateContact({ body });

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
