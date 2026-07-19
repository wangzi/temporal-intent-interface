// The work surface's cases.
//
// SCAFFOLD. Every case below is `status: "draft"` and carries NO narrative,
// because the narrative is authored prose about a real person's real work and
// is not mine to write. Inventing it is exactly the failure mode the resume's
// source-fidelity check exists to prevent, and no verifier would catch it here
// because there is no source document to check against.
//
// A draft case is still useful: it renders the resume claims it is evidence
// for, and those are real, verbatim, and already verified against the source
// PDF. So the page has true content on it from the first commit — it just has
// no story yet.
//
// To publish a case: write `narrative`, add media/artifacts, flip `status` to
// "published". The schema refuses to publish a case with an empty narrative,
// and refuses any narrative that states a metric — reference the resume claim
// instead (see assertNoLooseMetrics in ./schemas.ts).
//
// Dates and employer names are NOT stored here. Cases with an organizationId
// derive them from the resume, so a case cannot drift from the record.

import { WorkSchema } from "./schemas";
import type { Work } from "./types";

const workInput = {
  version: "1.0.0",
  cases: [
    {
      slug: "timeless-wallet",
      title: "Timeless Wallet",
      status: "draft",
      organizationId: "timeless-wallet",
      evidenceClaimIds: [
        "tw-ai-native-ux",
        "tw-toothbrush-test",
        "tw-scale",
        "tw-funding",
      ],
      narrative: [],
      media: [],
      artifacts: [],
      links: [],
    },
    {
      slug: "timeless-calendar",
      title: "Timeless Calendar",
      status: "draft",
      organizationId: "timeless-calendar",
      evidenceClaimIds: [
        "tc-marketplace",
        "tc-ml-models",
        "tc-monetization",
        "tc-funding-team",
      ],
      narrative: [],
      media: [],
      artifacts: [],
      links: [],
    },
    {
      slug: "glow-headphones",
      title: "Glow Headphones",
      status: "draft",
      organizationId: "glow-headphones",
      evidenceClaimIds: ["glow-laser", "glow-kickstarter", "glow-production"],
      narrative: [],
      media: [],
      artifacts: [],
      links: [],
    },
    {
      slug: "google",
      title: "Google",
      status: "draft",
      organizationId: "google",
      evidenceClaimIds: [
        "gx-glass-ar",
        "gx-robotics",
        "android-platform-ecosystem",
        "android-brand-architecture",
        "android-gtm",
        "android-agencies",
        "android-oem-carrier",
        "chrome-monetization",
        "chrome-war-room",
        "risk-etl",
        "risk-models",
      ],
      narrative: [],
      media: [],
      artifacts: [],
      links: [],
    },
    // ── Work + play ───────────────────────────────────────────────────────
    // Titles here are short labels for navigation, not claims. The claim text
    // they point at carries the actual assertion.
    {
      slug: "solid-propellant-rocket",
      title: "Solid-propellant rocket",
      status: "draft",
      evidenceClaimIds: ["wp-rocket"],
      narrative: [],
      media: [],
      artifacts: [],
      links: [],
    },
    {
      slug: "orbital-robotics",
      title: "Orbital robotics aboard ISS",
      status: "draft",
      evidenceClaimIds: ["wp-iss"],
      narrative: [],
      media: [],
      artifacts: [],
      links: [],
    },
    {
      slug: "tgi-ml",
      title: "TGI-ML",
      status: "draft",
      evidenceClaimIds: ["wp-tgi-ml"],
      narrative: [],
      media: [],
      artifacts: [],
      links: [],
    },
    {
      slug: "relay-marathon",
      title: "Relay marathon",
      status: "draft",
      evidenceClaimIds: ["wp-relay"],
      narrative: [],
      media: [],
      artifacts: [],
      links: [],
    },
  ],
} as const;

/** Parsed at import: an invalid or metric-asserting case fails the build. */
export const work: Work = WorkSchema.parse(workInput);

export function findCase(slug: string): Work["cases"][number] | undefined {
  return work.cases.find((c) => c.slug === slug);
}

export const publishedCases = work.cases.filter(
  (c) => c.status === "published",
);
