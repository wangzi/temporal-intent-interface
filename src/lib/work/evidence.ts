// The bridge between a portfolio case and the factual record.
//
// A case never stores a metric, an employer name, or a date. It stores claim
// IDS, and this module resolves them against the resume at render time. So
// "$1M+ raised" on a case page is literally the same string that
// verify:source proved against the source PDF — not a retelling of it.
//
// That is the whole point. A portfolio is where career numbers go to drift:
// you write "over a million" once, then "well over a million" a year later,
// and nothing anywhere objects. Here the number has exactly one home.

import { resume } from "@/lib/resume/data";
import type { Claim, Experience } from "@/lib/resume/types";

import type { WorkCase } from "./types";

/** Every claim in the resume, addressable by id. */
const CLAIM_INDEX: ReadonlyMap<string, Claim> = new Map([
  ...resume.experience.flatMap((entry) =>
    entry.positions.flatMap((position) =>
      position.claims.map((claim) => [claim.id, claim] as const),
    ),
  ),
  ...resume.workPlay.map((claim) => [claim.id, claim] as const),
]);

const ORGANIZATION_INDEX: ReadonlyMap<string, Experience> = new Map(
  resume.experience.map((entry) => [entry.id, entry] as const),
);

export function claimById(id: string): Claim | undefined {
  return CLAIM_INDEX.get(id);
}

export function organizationById(id: string): Experience | undefined {
  return ORGANIZATION_INDEX.get(id);
}

/**
 * Resolve a case's evidence.
 *
 * Throws on an unknown id rather than skipping it: a case that silently
 * renders three of its four claims looks finished and isn't.
 */
export function evidenceFor(workCase: WorkCase): Claim[] {
  return workCase.evidenceClaimIds.map((id) => {
    const claim = claimById(id);
    if (!claim) {
      throw new Error(
        `work: case "${workCase.slug}" references unknown resume claim "${id}"`,
      );
    }
    return claim;
  });
}

/** "2023 — Present" for an employer-linked case, or null when unstated. */
export function periodFor(workCase: WorkCase): string | null {
  if (!workCase.organizationId) return null;
  const org = organizationById(workCase.organizationId);
  if (!org) {
    throw new Error(
      `work: case "${workCase.slug}" references unknown organization "${workCase.organizationId}"`,
    );
  }
  return `${org.startYear} — ${org.endYear}`;
}

/** Employer location, straight from the record. */
export function locationFor(workCase: WorkCase): string | null {
  if (!workCase.organizationId) return null;
  return organizationById(workCase.organizationId)?.location ?? null;
}
