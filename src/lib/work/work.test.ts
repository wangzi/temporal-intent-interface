// The work surface's contract.
//
// The failure this file exists to prevent: a portfolio case quietly asserting
// a different number than the resume does. Career metrics drift when they have
// two homes, and the resume's own verifier only ever looks at the resume.

import { describe, expect, it } from "vitest";

import { resume } from "@/lib/resume/data";
import { assertNoPrivateContact } from "@/lib/resume/schemas";

import { findCase, publishedCases, work } from "./data";
import { claimById, evidenceFor, locationFor, periodFor } from "./evidence";
import { WorkSchema, assertNoLooseMetrics } from "./schemas";

describe("work data", () => {
  it("re-parses through its own schema", () => {
    expect(() => WorkSchema.parse(work)).not.toThrow();
  });

  it("has unique case slugs", () => {
    const slugs = work.cases.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses URL-safe slugs", () => {
    for (const c of work.cases) {
      expect(encodeURIComponent(c.slug)).toBe(c.slug);
    }
  });

  it("leaks no contact details", () => {
    expect(() => assertNoPrivateContact(work)).not.toThrow();
  });

  it("is all draft while the narrative is unwritten", () => {
    // A scaffold that shipped as "published" would be claiming finished work.
    expect(publishedCases).toHaveLength(0);
    for (const c of work.cases) expect(c.status).toBe("draft");
  });

  it("invents no narrative", () => {
    // The scaffold contains structure only. Prose about a real person's work
    // is theirs to write; placeholder prose is just fabrication with an
    // apology attached.
    for (const c of work.cases) expect(c.narrative).toEqual([]);
  });
});

describe("evidence resolves against the resume", () => {
  it("every referenced claim id exists", () => {
    for (const c of work.cases) {
      expect(() => evidenceFor(c), c.slug).not.toThrow();
      expect(evidenceFor(c).length).toBe(c.evidenceClaimIds.length);
    }
  });

  it("every case is evidence for something", () => {
    for (const c of work.cases) {
      expect(c.evidenceClaimIds.length, c.slug).toBeGreaterThan(0);
    }
  });

  it("renders claim text identical to the resume, never a copy", () => {
    for (const c of work.cases) {
      for (const claim of evidenceFor(c)) {
        expect(claim.text).toBe(claimById(claim.id)?.text);
      }
    }
  });

  it("derives employer period and location from the record", () => {
    const glow = findCase("glow-headphones");
    expect(periodFor(glow!)).toBe("2015 — 2017");
    expect(locationFor(glow!)).toBe(
      resume.experience.find((e) => e.id === "glow-headphones")?.location,
    );
  });

  it("keeps the ongoing role open-ended", () => {
    expect(periodFor(findCase("timeless-wallet")!)).toBe("2023 — Present");
  });

  it("shows no period for work with none stated in the source", () => {
    expect(periodFor(findCase("solid-propellant-rocket")!)).toBeNull();
    expect(locationFor(findCase("tgi-ml")!)).toBeNull();
  });

  it("throws on an unknown claim id rather than rendering a short case", () => {
    expect(() =>
      evidenceFor({
        ...findCase("tgi-ml")!,
        evidenceClaimIds: ["not-a-claim"],
      }),
    ).toThrow(/unknown resume claim/);
  });

  it("throws on an unknown organization id", () => {
    expect(() =>
      periodFor({ ...findCase("google")!, organizationId: "not-an-org" }),
    ).toThrow(/unknown organization/);
  });

  it("covers every organization in the resume", () => {
    const linked = work.cases.map((c) => c.organizationId).filter(Boolean);
    expect(new Set(linked)).toEqual(
      new Set(resume.experience.map((e) => e.id)),
    );
  });
});

describe("narrative may not restate a metric", () => {
  it.each([
    ["dollars", "We raised $1.2M in a pre-seed round."],
    ["dollars, spaced", "It closed at $ 980K."],
    ["multiplier", "Traffic grew 12x in a year."],
    ["percentage", "Retention improved 40%."],
    ["scale suffix", "The community reached 110K people."],
    ["millions in words", "We shipped to 1.5 million users."],
    ["bare large number", "It shipped 30000 units."],
  ])("rejects %s", (_label, paragraph) => {
    expect(() => assertNoLooseMetrics([paragraph], "case")).toThrow(
      /narrative metric/,
    );
  });

  it("allows prose that carries no number", () => {
    expect(() =>
      assertNoLooseMetrics(
        [
          "The hardest part was manufacturing, not the optics.",
          "We rebuilt the onboarding twice before it held.",
        ],
        "case",
      ),
    ).not.toThrow();
  });

  it("names the offending fragment so the fix is obvious", () => {
    expect(() =>
      assertNoLooseMetrics(["We passed 550K users."], "glow"),
    ).toThrow(/550K/);
  });
});

describe("schema guards", () => {
  const base = {
    slug: "x",
    title: "X",
    status: "draft" as const,
    evidenceClaimIds: ["wp-rocket"],
    narrative: [],
    media: [],
    artifacts: [],
    links: [],
  };

  it("refuses to publish a case with no narrative", () => {
    expect(() =>
      WorkSchema.parse({
        version: "1.0.0",
        cases: [{ ...base, status: "published" }],
      }),
    ).toThrow(/published but has no narrative/);
  });

  it("refuses remotely hosted media", () => {
    expect(() =>
      WorkSchema.parse({
        version: "1.0.0",
        cases: [
          {
            ...base,
            media: [
              {
                src: "https://cdn.example.com/a.png",
                alt: "a",
                width: 1,
                height: 1,
              },
            ],
          },
        ],
      }),
    ).toThrow(/self-hosted/);
  });

  it("requires alt text on media", () => {
    expect(() =>
      WorkSchema.parse({
        version: "1.0.0",
        cases: [
          {
            ...base,
            media: [{ src: "/work/media/a.png", alt: "", width: 1, height: 1 }],
          },
        ],
      }),
    ).toThrow();
  });

  it("refuses remotely hosted artifacts", () => {
    // A third-party frame origin would mean widening frame-src beyond 'self'.
    expect(() =>
      WorkSchema.parse({
        version: "1.0.0",
        cases: [
          {
            ...base,
            artifacts: [
              {
                src: "https://claude.site/artifacts/abc",
                title: "t",
                description: "d",
                height: 400,
              },
            ],
          },
        ],
      }),
    ).toThrow(/self-hosted/);
  });

  it("requires artifacts at the expected self-hosted path shape", () => {
    expect(() =>
      WorkSchema.parse({
        version: "1.0.0",
        cases: [
          {
            ...base,
            artifacts: [
              {
                src: "/work/artifacts/demo/app.html",
                title: "t",
                description: "d",
                height: 400,
              },
            ],
          },
        ],
      }),
    ).toThrow(/self-hosted/);
  });

  it("rejects a duplicate case slug", () => {
    expect(() =>
      WorkSchema.parse({ version: "1.0.0", cases: [base, { ...base }] }),
    ).toThrow(/duplicate case slug/);
  });

  it("rejects a metric smuggled through the schema", () => {
    expect(() =>
      WorkSchema.parse({
        version: "1.0.0",
        cases: [
          { ...base, status: "published", narrative: ["We raised $800K."] },
        ],
      }),
    ).toThrow(/narrative metric/);
  });
});
