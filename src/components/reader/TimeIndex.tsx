"use client";

// The timeline header — a persistent status line (always visible) plus a
// hover-revealed year menu, hung on the entry grid (meta | spine | content).
//
// ALWAYS visible (a discovery affordance — nothing fully hidden):
//   • Sort-direction toggle, in the meta column: "Now → Past" (newest) /
//     "Now ← Past" (oldest). One shared axis — only the arrow flips, so the
//     glyphs line up exactly (mono = equal width). URL-driven (?sort=),
//     preserves the filter, works JS-off.
//   • A faint bash-terminal status line: today's date + how long since the
//     last entry.
// HOVER reveals:
//   • The years (jump-to-year), aligned to the spine.
//
// Laptop+ only (the header is display:none below 1080px).

import { useCallback } from "react";
import Link from "next/link";

const SORTS: { key: "newest" | "oldest"; label: string }[] = [
  { key: "newest", label: "Now → Past" },
  { key: "oldest", label: "Now ← Past" },
];

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
  today,
  lastEntryAgo,
}: {
  years: string[];
  currentSort?: "newest" | "oldest";
  currentFilter?: string;
  today?: string;
  lastEntryAgo?: string;
}) {
  const onClick = useCallback((year: string) => {
    const target = document.querySelector<HTMLElement>(
      `[data-entry-index][data-year="${year}"]`,
    );
    if (target) scrollEntryToDot(target);
  }, []);

  return (
    <div className="topyears">
      <div className="topyears-inner">
        {/* Persistent status: sort toggle (meta column) + bash date line. */}
        <div className="ty-status">
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
          {today ? (
            <p className="ty-date" aria-label="Archive status">
              <span className="ty-prompt" aria-hidden="true">
                $
              </span>
              {today}
              {lastEntryAgo ? ` · last entry ${lastEntryAgo}` : ""}
            </p>
          ) : null}
        </div>

        {/* Hover-revealed: years, aligned to the spine. */}
        {years.length > 0 ? (
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
        ) : null}
      </div>
    </div>
  );
}
