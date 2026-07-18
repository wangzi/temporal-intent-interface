// JSON-LD contract + privacy.
//
// The structured document is what assistants and search engines actually read,
// so it needs the same guarantees as the rendered page: same facts, same
// source, and absolutely no contact details.

import { describe, expect, it } from "vitest";

import { resume } from "./data";
import { resumeJsonLd } from "./jsonld";
import { assertNoPrivateContact } from "./schemas";

const doc = resumeJsonLd();

describe("resume JSON-LD", () => {
  it("is a schema.org Person", () => {
    expect(doc["@context"]).toBe("https://schema.org");
    expect(doc["@type"]).toBe("Person");
    expect(doc.name).toBe(resume.person.name);
  });

  it("points at the canonical resume URL", () => {
    expect(doc.url).toBe("https://z.stillinlove.co/resume");
    expect(doc.mainEntityOfPage).toBe("https://z.stillinlove.co/resume");
  });

  it("links LinkedIn via sameAs", () => {
    expect(doc.sameAs).toEqual([resume.person.linkedin]);
  });

  it("lists every organization in worksFor", () => {
    const orgs = (doc.worksFor as { name: string }[]).map((o) => o.name);
    expect(orgs).toEqual([
      "Timeless Wallet",
      "Timeless Calendar",
      "Glow Headphones",
      "Google",
    ]);
  });

  it("emits one occupation per source-stated position", () => {
    const positions = resume.experience.flatMap((e) => e.positions);
    expect((doc.hasOccupation as unknown[]).length).toBe(positions.length);
  });

  it("omits endDate for the ongoing role rather than inventing one", () => {
    const current = (doc.hasOccupation as Record<string, unknown>[])[0];
    expect(current?.startDate).toBe("2023");
    expect(current).not.toHaveProperty("endDate");
  });

  it("lists all three institutions in alumniOf", () => {
    const names = (doc.alumniOf as { name: string }[]).map((o) => o.name);
    expect(names).toEqual(resume.education.map((e) => e.institution));
  });

  it("carries no email or telephone property", () => {
    const serialized = JSON.stringify(doc);
    expect(serialized).not.toMatch(/"(email|telephone|faxNumber)"/);
    expect(serialized).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(() => assertNoPrivateContact(doc)).not.toThrow();
  });

  it("serializes without a raw '<' so it cannot break out of a script block", () => {
    const escaped = JSON.stringify(doc).replace(/</g, "\\u003c");
    expect(escaped).not.toContain("<");
    // ...and is still valid JSON after escaping.
    expect(() => JSON.parse(escaped.replace(/\\u003c/g, "<"))).not.toThrow();
  });
});
