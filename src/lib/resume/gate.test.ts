// The pre-publication gate.
//
// The failure that matters here is a partial gate: the HTML page hidden while
// /resume.json still serves the entire record to anyone who guesses the path.
// These tests pin the full surface list, not just the page.

import { describe, expect, it } from "vitest";

import {
  GATED_PATHS,
  RESUME_COOKIE,
  RESUME_COOKIE_VALUE,
  RESUME_PASSCODE,
  isCorrectPasscode,
  isGatedPath,
  isUnlocked,
} from "./gate";

describe("gated surface", () => {
  it("covers every path that exposes resume content", () => {
    expect([...GATED_PATHS].sort()).toEqual(
      [
        "/llms.txt",
        "/resume",
        "/resume.json",
        "/resume/opengraph-image",
      ].sort(),
    );
  });

  it("gates the machine-readable surfaces, not only the page", () => {
    // /resume.json carries the same record verbatim; llms.txt is derived from
    // it; the OG image renders name and headline into a cacheable PNG.
    for (const path of [
      "/resume.json",
      "/llms.txt",
      "/resume/opengraph-image",
    ]) {
      expect(isGatedPath(path), path).toBe(true);
    }
  });

  it("gates the whole work subtree, artifacts and media included", () => {
    for (const path of [
      "/work",
      "/work/glow-headphones",
      "/work/artifacts/demo/index.html",
      "/work/media/photo.png",
    ]) {
      expect(isGatedPath(path), path).toBe(true);
    }
  });

  it("does not gate paths that merely start with the same letters", () => {
    // "/workshop" is not "/work".
    expect(isGatedPath("/workshop")).toBe(false);
    expect(isGatedPath("/working")).toBe(false);
  });

  it("leaves the reader alone", () => {
    for (const path of [
      "/",
      "/post/a-journal-is-a-field-not-a-list",
      "/s/some-token",
      "/feed.xml",
      "/robots.txt",
      "/sitemap.xml",
      "/api/v1/posts",
    ]) {
      expect(isGatedPath(path), path).toBe(false);
    }
  });

  it("leaves the unlock flow reachable, or nobody could ever get in", () => {
    expect(isGatedPath("/resume/unlock")).toBe(false);
    expect(isGatedPath("/resume/unlock/verify")).toBe(false);
  });
});

describe("passcode", () => {
  it("accepts the code, ignoring surrounding whitespace", () => {
    expect(isCorrectPasscode(RESUME_PASSCODE)).toBe(true);
    expect(isCorrectPasscode(` ${RESUME_PASSCODE} `)).toBe(true);
  });

  it("rejects everything else", () => {
    for (const wrong of ["", " ", "031", "03150", "0316", "abcd", "0 3 1 5"]) {
      expect(isCorrectPasscode(wrong), JSON.stringify(wrong)).toBe(false);
    }
  });

  it("rejects non-string submissions", () => {
    // A form field can arrive as a File, or be absent entirely.
    for (const wrong of [undefined, null, 315, 0.315, {}, [], true]) {
      expect(isCorrectPasscode(wrong)).toBe(false);
    }
  });

  it("does not accept a numeric equivalent of the code", () => {
    // "0315" trimmed is a string; Number("0315") === 315 must not pass.
    expect(isCorrectPasscode(315)).toBe(false);
    expect(isCorrectPasscode("315")).toBe(false);
  });
});

describe("cookie", () => {
  it("unlocks only on the exact token", () => {
    expect(isUnlocked(RESUME_COOKIE_VALUE)).toBe(true);
    expect(isUnlocked(undefined)).toBe(false);
    expect(isUnlocked("")).toBe(false);
    expect(isUnlocked("true")).toBe(false);
    expect(isUnlocked(RESUME_COOKIE_VALUE.slice(0, -1))).toBe(false);
  });

  it("is not the passcode itself", () => {
    // A leaked cookie shouldn't hand over a code the owner may reuse.
    expect(RESUME_COOKIE_VALUE).not.toContain(RESUME_PASSCODE);
    expect(RESUME_COOKIE).not.toContain(RESUME_PASSCODE);
  });
});
