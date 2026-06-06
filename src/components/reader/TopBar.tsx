"use client";

// Mobile + tablet topbar (CSS-hidden at ≥1080px). Owns:
//   - the brand label
//   - the inline filter nav (701–1079px only, CSS-controlled)
//   - the hamburger button (≤700px only)
//   - the scrim that backs the slide-in rail
//   - body.nav-open toggle (mobile rail show/hide)
//   - scrim click + Escape key close
//
// JS-off readers at mobile do NOT get the slide-in rail (the toggle
// requires JS). They can still read the archive and post bodies, and
// can apply filters via URL params (?filter=…) directly. The
// hamburger is rendered with aria-expanded so a screen reader knows
// when the menu is collapsed even without visual style.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { PostSummary } from "@/lib/engine/types";

function uniqueIntentLabels(posts: PostSummary[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const p of posts) {
    if (!seen.has(p.intent_label)) {
      seen.add(p.intent_label);
      order.push(p.intent_label);
    }
  }
  return order;
}

export function TopBar({
  posts,
  currentFilter,
}: {
  posts: PostSummary[];
  currentFilter?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const intents = uniqueIntentLabels(posts);
  const noFilter = !currentFilter;

  // Sync isOpen → body class. Read/write only via this effect so the
  // class accurately mirrors React state. ReaderControlsIsland also
  // clears the class on Escape (archive-route keydown).
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("nav-open");
    } else {
      document.body.classList.remove("nav-open");
    }
    return () => {
      document.body.classList.remove("nav-open");
    };
  }, [isOpen]);

  // Close on Escape — local listener so this component is
  // self-contained; ReaderControlsIsland's keydown handler also
  // clears body.nav-open if set, so double-press behaviour stays sane.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const onToggle = useCallback(() => setIsOpen((v) => !v), []);
  const onClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <header className="topbar">
        <nav className="topbar-nav" aria-label="Sections">
          <Link
            className={`navlink${noFilter ? " on" : ""}`}
            href="/"
            aria-current={noFilter ? "page" : undefined}
          >
            Latest
          </Link>
          {intents.map((label) => {
            const isActive = currentFilter === label;
            return (
              <Link
                key={label}
                className={`navlink${isActive ? " on" : ""}`}
                href={`/?filter=${encodeURIComponent(label)}`}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="menu-btn"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="reader-rail"
          onClick={onToggle}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d={isOpen ? "M6 6l12 12M6 18L18 6" : "M3 6h18M3 12h18M3 18h18"} />
          </svg>
        </button>
      </header>
      <div
        className="scrim"
        aria-hidden="true"
        onClick={onClose}
      />
    </>
  );
}
