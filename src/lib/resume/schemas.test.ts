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

  it.each(["email", "Email", "e-mail", "telephone", "phone", "mobile", "fax"])(
    "rejects the forbidden key %s",
    (key) => {
      expect(() => assertNoPrivateContact({ [key]: "anything" })).toThrow(
        /forbidden key/,
      );
    },
  );

  it("does not mistake plain years or metrics for phone numbers", () => {
    expect(() =>
      assertNoPrivateContact({
        years: "2007–2009",
        metric: "1.5M+ users, 140K+ app downloads, $980K+",
        span: "2006-2015",
      }),
    ).not.toThrow();
  });

  it("rejects a resume that reintroduces contact details", () => {
    const tainted = {
      ...resume,
      person: { ...resume.person, email: "someone@example.com" },
    };
    expect(() => ResumeSchema.parse(tainted)).toThrow();
  });
});
