// Contract + privacy tests for the resume.
//
// Two jobs:
//  1. Pin the high-risk facts (metrics, dates, employers) so a careless edit
//     cannot quietly change a public claim about a real person.
//  2. Prove the privacy policy is enforced STRUCTURALLY, not by convention —
//     email and phone must be rejected wherever they appear, at any depth.

import { describe, expect, it } from "vitest";

import { resume } from "./data";
import { ResumeSchema, allClaimIds, assertNoPrivateContact } from "./schemas";

const claimText = (id: string): string => {
  const all = [
    ...resume.experience.flatMap((e) => e.positions.flatMap((p) => p.claims)),
    ...resume.workPlay,
  ];
  const found = all.find((c) => c.id === id);
  if (!found) throw new Error(`no claim ${id}`);
  return found.text;
};

describe("resume parses and is internally consistent", () => {
  it("re-parses cleanly through its own schema", () => {
    expect(() => ResumeSchema.parse(resume)).not.toThrow();
  });

  it("has unique claim ids", () => {
    const ids = allClaimIds(resume);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(resume)).toBe(true);
  });

  it("records the source document hash", () => {
    expect(resume.sourceSha256).toBe(
      "6fe827e7b603c192b5cd59a332470fda9f2b844342f6613fa35bbdd575a47edb",
    );
  });
});

describe("employers, order and dates match the source document", () => {
  it("lists the four organizations newest-first", () => {
    expect(resume.experience.map((e) => e.organization)).toEqual([
      "Timeless Wallet",
      "Timeless Calendar",
      "Glow Headphones",
      "Google",
    ]);
  });

  it.each([
    ["timeless-wallet", 2023, "Present"],
    ["timeless-calendar", 2019, 2022],
    ["glow-headphones", 2015, 2017],
    ["google", 2006, 2015],
  ])("%s spans %s–%s", (id, start, end) => {
    const e = resume.experience.find((x) => x.id === id);
    expect(e?.startYear).toBe(start);
    expect(e?.endYear).toBe(end);
  });

  it("keeps the current role open-ended as 'Present', never a year", () => {
    expect(resume.experience[0]?.endYear).toBe("Present");
  });

  it("lists Google's four positions with source-stated titles and spans", () => {
    const google = resume.experience.find((e) => e.id === "google");
    expect(
      google?.positions.map((p) => [p.role, p.team, p.startYear, p.endYear]),
    ).toEqual([
      ["Founding Team", "ACME Lab, Google X", 2014, 2015],
      ["Global Design & Creative Director", "Android", 2008, 2013],
      ["Technical Program Manager", "Chrome", 2008, 2009],
      ["Risk Data Engineer", "Checkout & DoubleClick", 2006, 2007],
    ]);
  });

  it("does NOT invent titles the document omits", () => {
    const calendar = resume.experience.find(
      (e) => e.id === "timeless-calendar",
    );
    const glow = resume.experience.find((e) => e.id === "glow-headphones");
    expect(calendar?.positions[0]?.role).toBeUndefined();
    expect(glow?.positions[0]?.role).toBeUndefined();
  });
});

describe("high-risk metrics are exactly as stated", () => {
  it.each([
    ["tw-scale", "20+ person"],
    ["tw-scale", "110K+ community"],
    ["tw-scale", "70+ weekly podcasts"],
    ["tw-scale", "1.5M+ users"],
    ["tw-scale", "140K+ app downloads"],
    ["tw-scale", "$980K+ in on-chain fees"],
    ["tw-funding", "$1.2M in pre-seed funding"],
    ["tw-funding", "ERC-4337"],
    ["tc-funding-team", "$800K in pre-seed funding"],
    ["tc-funding-team", "5-person technical team"],
    ["glow-kickstarter", "top-3 Kickstarter campaign ($1M+ raised)"],
    ["glow-kickstarter", "550K+"],
    ["glow-production", "30K+ shipped units"],
    ["gx-glass-ar", "$20M R&D lab"],
    ["android-brand-architecture", "23+ regional markets"],
    ["android-brand-architecture", "(13 OEMs, 5 carriers, app developers)"],
    ["android-agencies", ">1B devices worldwide"],
    ["wp-rocket", "12-ft solid-propellant rocket"],
    ["wp-iss", "(STS-135)"],
    ["wp-relay", "200-mile relay marathon"],
    ["wp-tgi-ml", "150+ in-person meetups"],
    ["wp-tgi-ml", "1,000+ founders since 2017"],
  ])("%s contains %s", (id, fragment) => {
    expect(claimText(id)).toContain(fragment);
  });

  it("carries no PDF kerning artifacts into public text", () => {
    const everything = JSON.stringify(resume);
    for (const artifact of [
      "l aser",
      "1 3 OEMs",
      "marketplac e",
      "c ustom",
      "i n - person",
      "S ocialFi",
      "$980K +",
    ]) {
      expect(everything).not.toContain(artifact);
    }
  });
});

describe("education and work + play", () => {
  it("lists all three credentials with source years", () => {
    expect(resume.education.map((e) => [e.institution, e.years])).toEqual([
      ["The Wharton School, University of Pennsylvania", "2012"],
      ["Stanford University — GSB Executive Program", "2007–2009"],
      ["Georgia State University", "2005"],
    ]);
  });

  it("has four work + play entries", () => {
    expect(resume.workPlay).toHaveLength(4);
  });
});

describe("privacy: email and phone are excluded and structurally rejected", () => {
  it("the published resume contains no email or phone anywhere", () => {
    const serialized = JSON.stringify(resume);
    // Fragments of the real values, split so this test file never contains them.
    expect(serialized).not.toContain(["wangzi315", "@", "gmail.com"].join(""));
    expect(serialized).not.toContain(["678", "464", "0214"].join("-"));
    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(() => assertNoPrivateContact(resume)).not.toThrow();
  });

  it.each([
    ["top-level email value", { a: ["x", "y@example.com"] }],
    ["deeply nested email", { a: { b: { c: [{ d: "z@example.org" }] } } }],
  ])("rejects %s", (_label, payload) => {
    expect(() => assertNoPrivateContact(payload)).toThrow(/email-shaped/);
  });

  it.each([
    ["dashed", "678-464-0214"],
    ["parenthesized", "(678) 464-0214"],
    ["dotted", "678.464.0214"],
    ["country-coded", "+1 678 464 0214"],
  ])("rejects a %s phone number at any depth", (_label, value) => {
    expect(() => assertNoPrivateContact({ deep: { deeper: [value] } })).toThrow(
      /phone-shaped/,
    );
  });

  it.each([
    // Typographic separators — what a word processor produces when you paste
    // a contact line. An ASCII-only separator class misses every one of these.
    ["en dash", "678–464–0214"],
    ["em dash", "678—464—0214"],
    ["figure dash", "678‒464‒0214"],
    ["non-breaking hyphen", "678‑464‑0214"],
    ["minus sign", "678−464−0214"],
    ["non-breaking space", "678 464 0214"],
  ])("rejects a phone written with a %s", (_label, value) => {
    expect(() => assertNoPrivateContact({ deep: [value] })).toThrow(
      /phone-shaped/,
    );
  });

  it("rejects a phone stored as a number rather than a string", () => {
    // Numbers used to fall through every branch of the walk unexamined.
    expect(() => assertNoPrivateContact({ contact: 6784640214 })).toThrow(
      /phone-shaped/,
    );
    expect(() => assertNoPrivateContact([16784640214])).toThrow(/phone-shaped/);
  });

  it.each([
    "email",
    "Email",
    "e-mail",
    "telephone",
    "phone",
    "mobile",
    "fax",
    // Compound and plural forms. The previous word-boundary pattern let all
    // of these through, which mattered most in jsonld.ts — a hand-built
    // object literal that no strict schema ever validates.
    "emailAddress",
    "contactEmail",
    "emails",
    "phoneNumber",
    "phones",
    "mobileNumber",
    "faxNumber",
    "telephoneNumber",
  ])("rejects the forbidden key %s", (key) => {
    expect(() => assertNoPrivateContact({ [key]: "anything" })).toThrow(
      /forbidden key/,
    );
  });

  it("rejects private contact inside a Map or Set", () => {
    expect(() =>
      assertNoPrivateContact(new Map([["notes", "reach me at a@b.com"]])),
    ).toThrow(/email-shaped/);
    expect(() => assertNoPrivateContact(new Set(["678-464-0214"]))).toThrow(
      /phone-shaped/,
    );
  });

  it("does not mistake years, metrics or long round numbers for phones", () => {
    expect(() =>
      assertNoPrivateContact({
        years: "2007–2009",
        metric: "1.5M+ users, 140K+ app downloads, $980K+",
        span: "2006-2015",
        // Ten digits, but not a dialable NANP number (area code starts with 1).
        bigRoundNumber: 1000000000,
        scaled: "accelerated Android adoption to >1B devices worldwide",
      }),
    ).not.toThrow();
  });

  it("rejects a resume whose claim text reintroduces contact details", () => {
    // Injected into an ALLOWED field on purpose. Adding a stray `email` key to
    // person instead would fail PersonSchema.strict() with unrecognized_keys
    // and never reach the privacy refinement — so that test would still pass
    // if the privacy rule were deleted outright. This one cannot.
    const first = resume.experience[0]!;
    const position = first.positions[0]!;
    const tainted = {
      ...resume,
      experience: [
        {
          ...first,
          positions: [
            {
              ...position,
              claims: [
                { ...position.claims[0]!, text: "Reach me at 678-464-0214." },
                ...position.claims.slice(1),
              ],
            },
            ...first.positions.slice(1),
          ],
        },
        ...resume.experience.slice(1),
      ],
    };
    expect(() => ResumeSchema.parse(tainted)).toThrow(/resume privacy/);
  });

  it("still rejects a forbidden key on a strict object", () => {
    const tainted = {
      ...resume,
      person: { ...resume.person, email: "someone@example.com" },
    };
    expect(() => ResumeSchema.parse(tainted)).toThrow();
  });
});

describe("the exported resume is deeply immutable", () => {
  it("freezes nested arrays and objects, not just the root", () => {
    expect(Object.isFrozen(resume)).toBe(true);
    expect(Object.isFrozen(resume.experience)).toBe(true);
    const entry = resume.experience[0]!;
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(entry.positions)).toBe(true);
    expect(Object.isFrozen(entry.positions[0]!.claims)).toBe(true);
    expect(Object.isFrozen(entry.positions[0]!.claims[0]!)).toBe(true);
    expect(Object.isFrozen(resume.person.summary)).toBe(true);
  });

  it("throws rather than silently reordering a published claim in place", () => {
    // The hazard this guards: a module singleton mutated for the lifetime of
    // the server process, altering a real person's record on every request.
    const claims = resume.experience[0]!.positions[0]!.claims;
    expect(() => (claims as { sort: () => void }).sort()).toThrow();
    expect(() =>
      (claims as unknown as unknown[]).push({ id: "x", text: "y" }),
    ).toThrow();
  });
});
