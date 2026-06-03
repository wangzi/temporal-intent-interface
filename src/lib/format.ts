// SSR-safe date helpers. Absolute dates render server-side; relative
// "ago" strings are produced from a deterministic `now` argument so
// the same call returns the same value when invoked from both the
// server (during SSR) and the client (during hydration), eliminating
// hydration mismatches.
//
// When the client wants to refresh a relative string after the page
// has been visible for a while, it can call `relativeAgo(iso, Date.now())`
// inside a useEffect (post-hydration) — that's not a mismatch, it's
// an intentional later update.

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

/**
 * Prototype-style scan-state meta date, e.g. "MON 5.25.26".
 * Uses UTC components to avoid timezone-induced hydration drift.
 */
export function formatScanDate(iso: string): string {
  const date = new Date(iso);
  const weekday = date
    .toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
    .toUpperCase();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear() % 100;
  return `${weekday} ${month}.${day}.${String(year).padStart(2, "0")}`;
}

/** Long-form date, e.g. "April 27, 2026". For <time> title attributes. */
export function formatAbsoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Relative "ago" string. Stable across SSR + client when `now` matches. */
export function relativeAgo(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) {
    const m = Math.max(1, Math.round(diff / MINUTE));
    return m === 1 ? "1 min ago" : `${m} min ago`;
  }
  if (diff < DAY) {
    const h = Math.max(1, Math.round(diff / HOUR));
    return h === 1 ? "1 hr ago" : `${h} hr ago`;
  }
  if (diff < WEEK) {
    const d = Math.max(1, Math.round(diff / DAY));
    return d === 1 ? "yesterday" : `${d} days ago`;
  }
  if (diff < MONTH) {
    const w = Math.max(1, Math.round(diff / WEEK));
    return w === 1 ? "1 week ago" : `${w} weeks ago`;
  }
  if (diff < YEAR) {
    const mo = Math.max(1, Math.round(diff / MONTH));
    return mo === 1 ? "1 month ago" : `${mo} months ago`;
  }
  const y = Math.max(1, Math.round(diff / YEAR));
  return y === 1 ? "1 year ago" : `${y} years ago`;
}

/**
 * Whole days elapsed since `iso`, from a deterministic `now` (ms epoch).
 * Floored, never negative; stable across SSR + hydration when `now` matches.
 * Use for the terminal hero's "Last entry N days ago": `relativeAgo` caps
 * day-granularity at 6 days then switches to weeks, so it cannot express
 * "N days" for N >= 7.
 */
export function daysAgo(iso: string, now: number): number {
  const then = new Date(iso).getTime();
  return Math.max(0, Math.floor((now - then) / DAY));
}

export function readingTimeLabel(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  return `${m} min read`;
}

export function postYear(iso: string): string {
  return String(new Date(iso).getUTCFullYear());
}
