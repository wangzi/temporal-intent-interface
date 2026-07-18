// schema.org/Person for the resume, derived from the SAME parsed resume object
// the page and /resume.json render. One source of truth: an agent reading the
// JSON-LD, a crawler reading the HTML, and a client fetching /resume.json all
// see identical facts.
//
// Deliberately omits `email` and `telephone` (both exist in schema.org/Person
// and both are locked private). `knowsAbout` is NOT invented — it is drawn from
// terms the source document itself states.

import { resume } from "./data";
import { assertNoPrivateContact } from "./schemas";

const SITE = "https://z.stillinlove.co";

/** Organizations, newest first, as `worksFor`/`hasOccupation` anchors. */
function occupations() {
  return resume.experience.flatMap((entry) =>
    entry.positions.map((position) => ({
      "@type": "OccupationalExperience" as const,
      // Titles only where the source states one.
      ...(position.role ? { name: position.role } : {}),
      ...(position.team ? { department: position.team } : {}),
      startDate: String(position.startYear),
      ...(position.endYear === "Present"
        ? {}
        : { endDate: String(position.endYear) }),
      worksFor: {
        "@type": "Organization" as const,
        name: entry.organization,
      },
      location: {
        "@type": "Place" as const,
        address: entry.location,
      },
    })),
  );
}

function education() {
  return resume.education.map((item) => ({
    "@type": "EducationalOrganization" as const,
    name: item.institution,
  }));
}

/**
 * Subject-matter terms taken verbatim from the source document's own language.
 * Nothing here is inferred about the person beyond what the document says.
 */
const KNOWS_ABOUT = [
  "AI product management",
  "LLM-native platforms",
  "Retrieval-augmented generation",
  "Android",
  "Go-to-market strategy",
  "Consumer hardware",
  "Web3",
] as const;

export function resumeJsonLd(): Record<string, unknown> {
  const doc = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: resume.person.name,
    description: resume.person.headline,
    url: `${SITE}/resume`,
    mainEntityOfPage: `${SITE}/resume`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mountain View",
      addressRegion: "CA",
      addressCountry: "US",
    },
    sameAs: [resume.person.linkedin],
    knowsAbout: [...KNOWS_ABOUT],
    hasOccupation: occupations(),
    worksFor: resume.experience.map((entry) => ({
      "@type": "Organization",
      name: entry.organization,
    })),
    alumniOf: education(),
  };

  // Defence in depth: the structured document is re-checked before it can be
  // serialized into a page or an API response.
  assertNoPrivateContact(doc);
  return doc;
}
