"use client";

// The timeline header. A grid-aligned band that echoes the entry grid
// below it: the SORT-direction toggle sits in the meta column (right-
// aligned against the spine, like each entry's date column), and the
// YEARS align to the spine — the single vertical axis the whole reader
// hangs on.
//
// Auto-hides at ≥1080px under a top-edge hover strip (same pattern as the
// left rail); hidden at <1080px (the topbar carries filters there).
//
// Sort is URL-driven (?sort=) so it works JS-off and a link reproduces the
// order. Year buttons scroll the first entry of that year onto the dot
// line (client behaviour; honours prefers-reduced-motion).

import { useCallback } from "react";
import Link from "next/link";

const SORTS: { key: "newest" | "oldest"; label: string }[] = [
  { key: "newest", label: "Now → Past" },
  { key: "oldest", label: "Past → Now" },
];

// Build /?sort=…&filter=… preserving the active filter. newest is default
// (omitted from the URL).
function sortHref(sort: "newest" | "oldest", filter?: string): string {
  const sp = new URLSearchParams();
  if (sort !== "newest") sp.set("sort", sort);
  if (filter) sp.set("filter", filter);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

function scrollEntryToDot(target: HTMLElement): void {
  const dotY = window.innerHeight * 0.4;
  const r = target.getBoundingClientRect();
  const top = window.scrollY + r.top + r.height / 2 - dotY;
  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}

export function TimeIndex({
  years,
  currentSort = "newest",
  currentFilter,
}: {
  years: string[];
  currentSort?: "newest" | "oldest";
  currentFilter?: string;
}) {
  const onClick = useCallback((year: string) => {
    const target = document.querySelector<HTMLElement>(
      `[data-entry-index][data-year="${year}"]`,
    );
    if (target) scrollEntryToDot(target);
  }, []);

  if (years.length === 0) return null;

  return (
    <>
      {/* Hover trigger: thin strip on the top edge reveals the panel. */}
      <div className="topyears-trigger" aria-hidden="true" />
      <div className="topyears">
        <div className="topyears-inner">
          {/* SORT — in the meta column, right-aligned against the spine. */}
          <div className="ty-sort" role="group" aria-label="Sort order">
            {SORTS.map((s) => {
              const on = currentSort === s.key;
              return (
                <Link
                  key={s.key}
                  className={`ty-sort-opt${on ? " on" : ""}`}
                  href={sortHref(s.key, currentFilter)}
                  aria-current={on ? "true" : undefined}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>

          {/* YEARS — aligned to the spine. */}
          <nav className="ty-years" aria-label="Jump to year">
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
        </div>
      </div>
    </>
  );
}
