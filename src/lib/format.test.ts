// Date/label formatting. These are pure and deterministic by design — every
// function takes an explicit `now` rather than reading the clock, because they
// run on BOTH the server and the client and any drift between the two is a
// hydration mismatch. That contract is what these tests pin down.

import { describe, expect, it } from "vitest";

import {
  formatAbsoluteDate,
  formatScanDate,
  postYear,
  readingTimeLabel,
  relativeAgo,
} from "./format";

const ISO = "2026-05-25T12:00:00Z";
const AT = (ms: number) => new Date(ISO).getTime() + ms;
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatScanDate", () => {
  it("renders WEEKDAY M.D.YY in UTC", () => {
    expect(formatScanDate(ISO)).toBe("MON 5.25.26");
  });

  it("uses UTC, not local time, so SSR and client agree", () => {
    // 23:30Z is still the 25th in UTC but the 26th in +02:00 — if this ever
    // switched to local components, this assertion would flip.
    expect(formatScanDate("2026-05-25T23:30:00Z")).toBe("MON 5.25.26");
  });
});

describe("formatAbsoluteDate", () => {
  it("renders long form", () => {
    expect(formatAbsoluteDate(ISO)).toBe("May 25, 2026");
  });
});

describe("relativeAgo", () => {
  it.each([
    [0, "just now"],
    [30_000, "just now"],
    [MIN, "1 min ago"],
    [5 * MIN, "5 min ago"],
    [HOUR, "1 hr ago"],
    [3 * HOUR, "3 hr ago"],
    [DAY, "yesterday"],
    [3 * DAY, "3 days ago"],
    [8 * DAY, "1 week ago"],
  ])("%i ms ago -> %s", (delta, expected) => {
    expect(relativeAgo(ISO, AT(delta))).toBe(expected);
  });

  it("never goes negative for a future date", () => {
    expect(relativeAgo(ISO, AT(-DAY))).toBe("just now");
  });

  it("caps day-granularity at a week (the reason daysAgo once existed)", () => {
    // Past 7 days it switches to weeks, so it cannot express "10 days ago".
    expect(relativeAgo(ISO, AT(10 * DAY))).not.toContain("days");
  });
});

describe("readingTimeLabel", () => {
  it.each([
    [1, "1 min read"],
    [7.4, "7 min read"],
    [0, "1 min read"], // floors at 1 — "0 min read" would be nonsense
    [-5, "1 min read"],
  ])("%s -> %s", (input, expected) => {
    expect(readingTimeLabel(input)).toBe(expected);
  });
});

describe("postYear", () => {
  it("returns the UTC year", () => {
    expect(postYear(ISO)).toBe("2026");
    expect(postYear("2025-12-31T23:00:00Z")).toBe("2025");
  });
});
