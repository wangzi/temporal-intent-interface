"use client";

// Right-side year jump list, visible only at ≥1500px (CSS-driven via
// the .timeindex `display: none → flex` breakpoint in globals.css).
//
// Click handler scrolls the first entry of that year onto the dot
// line. JS-off readers see the year labels as plain buttons — clicks
// are no-ops but the list is informational (cheap density signal).
//
// Small client island; doesn't share state with ReaderControlsIsland.

import { useCallback } from "react";

function scrollEntryToDot(target: HTMLElement): void {
  const dotY = window.innerHeight * 0.4;
  const r = target.getBoundingClientRect();
  const top = window.scrollY + r.top + r.height / 2 - dotY;
  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}

export function TimeIndex({ years }: { years: string[] }) {
  const onClick = useCallback((year: string) => {
    const target = document.querySelector<HTMLElement>(
      `[data-entry-index][data-year="${year}"]`,
    );
    if (target) scrollEntryToDot(target);
  }, []);

  return (
    <nav className="timeindex" aria-label="Jump to year">
      {years.map((year) => (
        <button
          key={year}
          type="button"
          data-year={year}
          aria-label={`Jump to first entry of ${year}`}
          onClick={() => onClick(year)}
        >
          {year}
        </button>
      ))}
    </nav>
  );
}
