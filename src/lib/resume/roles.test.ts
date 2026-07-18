// Role views are a lens, not a rewrite. These tests exist to make that
// enforceable: a view may select and reorder claims, and must be incapable of
// altering a single character of the record.

import { describe, expect, it } from "vitest";

import { resume } from "./data";
import {
  ROLE_IDS,
  ROLE_LIST,
  ROLE_VIEWS,
  applyRole,
  claimCount,
  isInvalidRoleParam,
  isRoleId,
  parseRole,
  type RoleId,
} from "./roles";
import { allClaimIds, assertNoPrivateContact } from "./schemas";

const KNOWN = new Set(allClaimIds(resume));

/** id -> text, straight from the source record. */
const SOURCE_TEXT = new Map<string, string>([
  ...resume.experience.flatMap((e) =>
    e.positions.flatMap((p) => p.claims.map((c) => [c.id, c.text] as const)),
  ),
  ...resume.workPlay.map((c) => [c.id, c.text] as const),
]);

function claimsOf(
  r: ReturnType<typeof applyRole>,
): { id: string; text: string }[] {
  return [
    ...r.experience.flatMap((e) => e.positions.flatMap((p) => p.claims)),
    ...r.workPlay,
  ];
}

describe("role catalogue", () => {
  it("exposes exactly three views", () => {
    expect(ROLE_IDS).toEqual([
      "ai-product",
      "zero-to-one",
      "platform-ecosystem",
    ]);
    expect(ROLE_LIST).toHaveLength(3);
  });

  it("references only claim ids that exist in the resume", () => {
    for (const view of ROLE_LIST) {
      for (const id of view.claimIds) {
        expect(KNOWN.has(id), `${view.id} -> ${id}`).toBe(true);
      }
    }
  });

  it("repeats no claim id within a view", () => {
    for (const view of ROLE_LIST) {
      expect(new Set(view.claimIds).size).toBe(view.claimIds.length);
    }
  });

  it("keeps every view substantial and multi-employer", () => {
    // A view that collapsed to two claims at one employer would be a worse
    // artifact than the full record. Guard against that regression.
    for (const view of ROLE_LIST) {
      const applied = applyRole(resume, view);
      expect(claimCount(applied), view.id).toBeGreaterThanOrEqual(8);
      expect(applied.experience.length, view.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("selects a strict subset — no view shows everything", () => {
    for (const view of ROLE_LIST) {
      expect(view.claimIds.length).toBeLessThan(KNOWN.size);
    }
  });

  it("carries no contact details in its labels or notes", () => {
    expect(() => assertNoPrivateContact(ROLE_VIEWS)).not.toThrow();
  });
});

describe("parseRole", () => {
  it("accepts the three exact ids", () => {
    for (const id of ROLE_IDS) expect(parseRole(id)).toBe(id);
  });

  it("returns null when no parameter was supplied", () => {
    expect(parseRole(undefined)).toBeNull();
    expect(isInvalidRoleParam(undefined)).toBe(false);
  });

  it("rejects case mutations", () => {
    for (const v of [
      "AI-Product",
      "ai-Product",
      "ZERO-TO-ONE",
      "Platform-Ecosystem",
    ]) {
      expect(parseRole(v)).toBeNull();
      expect(isInvalidRoleParam(v)).toBe(true);
    }
  });

  it("rejects unknown, empty and whitespace values", () => {
    for (const v of [
      "",
      " ",
      "ai_product",
      "aiproduct",
      "designer",
      "ai-product ",
    ]) {
      expect(parseRole(v)).toBeNull();
      expect(isInvalidRoleParam(v)).toBe(true);
    }
  });

  it("refuses a repeated parameter rather than picking one", () => {
    expect(parseRole(["ai-product", "zero-to-one"])).toBeNull();
    expect(parseRole(["ai-product"])).toBeNull();
    expect(isInvalidRoleParam(["ai-product", "zero-to-one"])).toBe(true);
  });

  it("rejects values that only look like ids", () => {
    for (const v of [
      "ai-product/../etc",
      "ai-product?x",
      "<script>",
      "__proto__",
    ]) {
      expect(parseRole(v)).toBeNull();
    }
  });

  it("isRoleId agrees with parseRole for string input", () => {
    for (const v of [...ROLE_IDS, "nope", "AI-Product", ""]) {
      expect(isRoleId(v)).toBe(parseRole(v) !== null);
    }
  });
});

describe("applyRole", () => {
  const views = ROLE_LIST;

  it("never alters claim text", () => {
    for (const view of views) {
      for (const claim of claimsOf(applyRole(resume, view))) {
        expect(claim.text, `${view.id}/${claim.id}`).toBe(
          SOURCE_TEXT.get(claim.id),
        );
      }
    }
  });

  it("emits only claims the view selected", () => {
    for (const view of views) {
      const selected = new Set(view.claimIds);
      for (const claim of claimsOf(applyRole(resume, view))) {
        expect(selected.has(claim.id), `${view.id}/${claim.id}`).toBe(true);
      }
    }
  });

  it("emits every selected claim exactly once", () => {
    for (const view of views) {
      const ids = claimsOf(applyRole(resume, view)).map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.sort()).toEqual([...view.claimIds].sort());
    }
  });

  it("ranks claims within a position by the view's order", () => {
    for (const view of views) {
      const rank = new Map(view.claimIds.map((id, i) => [id, i]));
      const applied = applyRole(resume, view);
      for (const entry of applied.experience) {
        for (const position of entry.positions) {
          const ranks = position.claims.map((c) => rank.get(c.id) ?? -1);
          expect(
            [...ranks].sort((a, b) => a - b),
            view.id,
          ).toEqual(ranks);
        }
      }
    }
  });

  it("preserves chronology — org order stays a subsequence of the source", () => {
    const sourceOrder = resume.experience.map((e) => e.id);
    for (const view of views) {
      const viewOrder = applyRole(resume, view).experience.map((e) => e.id);
      const positions = viewOrder.map((id) => sourceOrder.indexOf(id));
      expect(positions.every((p) => p >= 0)).toBe(true);
      expect(
        [...positions].sort((a, b) => a - b),
        view.id,
      ).toEqual(positions);
    }
  });

  it("drops positions and organizations left with no claims", () => {
    for (const view of views) {
      const applied = applyRole(resume, view);
      for (const entry of applied.experience) {
        expect(entry.positions.length).toBeGreaterThan(0);
        for (const position of entry.positions) {
          expect(position.claims.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("leaves identity, summary and education untouched", () => {
    for (const view of views) {
      const applied = applyRole(resume, view);
      expect(applied.person).toEqual(resume.person);
      expect(applied.education).toEqual(resume.education);
    }
  });

  it("does not mutate the source resume", () => {
    const before = JSON.stringify(resume);
    for (const view of views) applyRole(resume, view);
    expect(JSON.stringify(resume)).toBe(before);
  });

  it("keeps employer, dates and location attached to every claim", () => {
    // A decontextualized claim is a misleading claim.
    for (const view of views) {
      for (const entry of applyRole(resume, view).experience) {
        const source = resume.experience.find((e) => e.id === entry.id);
        expect(entry.organization).toBe(source?.organization);
        expect(entry.startYear).toBe(source?.startYear);
        expect(entry.endYear).toBe(source?.endYear);
        expect(entry.location).toBe(source?.location);
      }
    }
  });

  it("leaks no contact details in any view", () => {
    for (const view of views) {
      expect(() =>
        assertNoPrivateContact(applyRole(resume, view)),
      ).not.toThrow();
    }
  });
});

describe("claimCount", () => {
  it("counts the full record", () => {
    expect(claimCount(resume)).toBe(KNOWN.size);
  });

  it("counts exactly what a view selected", () => {
    for (const view of ROLE_LIST) {
      expect(claimCount(applyRole(resume, view))).toBe(view.claimIds.length);
    }
  });

  it("every view is smaller than the full record", () => {
    for (const view of ROLE_LIST) {
      expect(claimCount(applyRole(resume, view))).toBeLessThan(
        claimCount(resume),
      );
    }
  });
});

describe("role ids are URL-safe", () => {
  it("needs no encoding", () => {
    for (const id of ROLE_IDS satisfies readonly RoleId[]) {
      expect(encodeURIComponent(id)).toBe(id);
    }
  });
});
