// Adaptive role views.
//
// A role view is a LENS, not a rewrite. It may select which claims appear and
// reorder them within their position — nothing else. No claim text is altered,
// no employer/date/credential is changed, and no claim is invented. That
// restriction is the whole point: the same record, re-emphasized, so a reader
// can check any view against /resume and find the identical sentences.
//
// Chronology is preserved. Organizations and positions stay in source order so
// the timeline still reads correctly; only the claims inside a position are
// selected and ranked.

import { resume } from "./data";
import { allClaimIds } from "./schemas";
import type { Resume } from "./types";

export const ROLE_IDS = [
  "ai-product",
  "zero-to-one",
  "platform-ecosystem",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

export interface RoleView {
  id: RoleId;
  /** Nav label. Generated text — it names the lens, not the person. */
  label: string;
  /** Describes what the filter did. Never asserts a fact about the person. */
  note: string;
  /** Ordered selection. Rank = index; every id must exist in the resume. */
  claimIds: readonly string[];
}

export const ROLE_VIEWS: Record<RoleId, RoleView> = {
  "ai-product": {
    id: "ai-product",
    label: "AI product",
    note: "Claims involving AI, ML and applied research, ranked first within each role.",
    claimIds: [
      "tw-ai-native-ux",
      "tw-toothbrush-test",
      "tc-ml-models",
      "tc-marketplace",
      "gx-glass-ar",
      "gx-robotics",
      "chrome-monetization",
      "risk-models",
      "risk-etl",
      "wp-tgi-ml",
      "wp-iss",
    ],
  },
  "zero-to-one": {
    id: "zero-to-one",
    label: "Zero to one",
    note: "Claims about founding, first builds and raising, ranked first within each role.",
    claimIds: [
      "glow-laser",
      "glow-kickstarter",
      "glow-production",
      "tw-funding",
      "tw-scale",
      "tc-funding-team",
      "tc-marketplace",
      "gx-robotics",
      "gx-glass-ar",
      "wp-rocket",
    ],
  },
  "platform-ecosystem": {
    id: "platform-ecosystem",
    label: "Platform & ecosystem",
    note: "Claims about platforms, partners and distribution at scale, ranked first within each role.",
    claimIds: [
      "android-platform-ecosystem",
      "android-brand-architecture",
      "android-oem-carrier",
      "android-agencies",
      "android-gtm",
      "tw-scale",
      "tc-monetization",
      "glow-production",
      "chrome-monetization",
      "tw-funding",
    ],
  },
};

export const ROLE_LIST: readonly RoleView[] = ROLE_IDS.map(
  (id) => ROLE_VIEWS[id],
);

/**
 * Every claim id referenced by a role must exist in the resume. Checked at
 * module load, so a typo or a renamed claim fails the build rather than
 * silently emptying a view in production.
 */
const KNOWN = new Set(allClaimIds(resume));
for (const view of ROLE_LIST) {
  for (const id of view.claimIds) {
    if (!KNOWN.has(id)) {
      throw new Error(
        `Role view "${view.id}" references unknown claim id "${id}".`,
      );
    }
  }
  if (new Set(view.claimIds).size !== view.claimIds.length) {
    throw new Error(`Role view "${view.id}" repeats a claim id.`);
  }
}

export function isRoleId(value: unknown): value is RoleId {
  return (
    typeof value === "string" && (ROLE_IDS as readonly string[]).includes(value)
  );
}

/**
 * Parse the ?role= parameter. Exact match only — a case-mutated value, an
 * unknown value, an empty value, or a repeated parameter all resolve to null,
 * and the route redirects those to the canonical /resume rather than guessing
 * at intent or rendering a half-empty document.
 */
export function parseRole(param: string | string[] | undefined): RoleId | null {
  if (param === undefined) return null;
  // A repeated ?role=a&role=b is ambiguous; refuse it rather than pick one.
  if (Array.isArray(param)) return null;
  return isRoleId(param) ? param : null;
}

/** True when a role parameter was supplied but did not resolve to a view. */
export function isInvalidRoleParam(
  param: string | string[] | undefined,
): boolean {
  return param !== undefined && parseRole(param) === null;
}

/**
 * Apply a view: keep only selected claims, ranked by their position in the
 * view's list, and drop positions and organizations left with nothing. The
 * returned object is the same shape as `resume`, so the page renders one way.
 */
export function applyRole(source: Resume, view: RoleView): Resume {
  const rank = new Map(view.claimIds.map((id, i) => [id, i]));
  const keep = <T extends { id: string }>(claims: readonly T[]): T[] =>
    claims
      .filter((c) => rank.has(c.id))
      .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));

  const experience = source.experience
    .map((entry) => ({
      ...entry,
      positions: entry.positions
        .map((position) => ({ ...position, claims: keep(position.claims) }))
        .filter((position) => position.claims.length > 0),
    }))
    .filter((entry) => entry.positions.length > 0);

  return {
    ...source,
    experience,
    workPlay: keep(source.workPlay),
  };
}

/** How many of the resume's claims a view keeps — shown to the reader. */
export function claimCount(r: Resume): number {
  return (
    r.experience.reduce(
      (n, e) => n + e.positions.reduce((m, p) => m + p.claims.length, 0),
      0,
    ) + r.workPlay.length
  );
}
