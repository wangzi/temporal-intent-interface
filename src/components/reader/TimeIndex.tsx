"use client";

// Year jump nav. Auto-hides at laptop+ (≥1080px) under a top-edge
// hover strip — same UX pattern as the left rail. Previously rendered
// as a vertical column on the right at ≥1500px; now renders as a
// horizontal slide-down panel at the top.
//
// At <1080px the panel is hidden entirely (the years list is short
// enough that scrolling to find them by date works fine on mobile;
// the topbar already carries the filter chips).
//
// Click handler scrolls the first entry of the chosen year onto the
// dot line. Honors prefers-reduced-motion.

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

  if (years.length === 0) return null;

  return (
    <>
      {/* Hover trigger: thin strip on the top edge. Sibling selector
          `.topyears-trigger:hover ~ .topyears` reveals the panel. */}
      <div className="topyears-trigger" aria-hidden="true" />
      <nav className="topyears" aria-label="Jump to year">
        <ol>
          {years.map((year) => (
            <li key={year}>
              <button
                type="button"
                data-year={year}
                aria-label={`Jump to first entry of ${year}`}
                onClick={() => onClick(year)}
              >
                {year}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
