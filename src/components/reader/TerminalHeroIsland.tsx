"use client";

// The single client island for the terminal hero. Returns null; fills the live
// local clock slot post-mount (viewer timezone → real "PDT"), then does nothing
// else. The server stays source-of-truth for all other markup.
//
// JS-off / reduced-motion: the clock slot stays empty (its height is reserved,
// so there is no layout shift). Filling text is not motion, so it runs under
// reduced motion too; only the ✻ prompt's CSS sparkle is gated (in globals.css).

import { useEffect } from "react";

// Live local clock, e.g. "6:35 PM PDT | Tue Jun 2 2026". Client-only and
// intentionally non-deterministic (viewer timezone → real "PDT") — deliberately
// NOT in format.ts, which is the deterministic, SSR-safe (UTC) module.
function formatLocalClock(d: Date): string {
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
    .format(d)
    .replace(/,/g, ""); // "Tue, Jun 2, 2026" → "Tue Jun 2 2026"
  return `${time} | ${date}`;
}

export function TerminalHeroIsland(): null {
  useEffect(() => {
    const clockEl = document.querySelector<HTMLElement>("[data-hero-clock]");
    if (clockEl) clockEl.textContent = formatLocalClock(new Date());
  }, []);

  return null;
}
