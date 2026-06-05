// SSR site footer — pure markup, no JavaScript. The reader spine terminates at
// this footer's top edge (height reserved via --footer-h in globals.css).
//
// Server component. Renders as part of the SSR'd HTML (visible JS-off).

import Link from "next/link";

import { formatAbsoluteDate } from "@/lib/format";

import { ThemeToggle } from "./ThemeToggle";

export function Footer({
  entryCount,
  updatedISO,
}: {
  /** Total entries (archive only). Omitted on a single post. */
  entryCount?: number;
  /** Latest entry date, ISO (archive only). */
  updatedISO?: string | null;
}) {
  // Server-rendered once; no client hydration → safe, deterministic per render.
  const year = new Date().getUTCFullYear();
  return (
    <footer className="site-footer mono" aria-label="Site footer">
      <div className="site-footer-meta">
        <Link href="/" className="site-footer-brand" aria-label="z. — home">
          z<span aria-hidden="true">.</span>
        </Link>
        <span>© {year}</span>
        {typeof entryCount === "number" ? (
          <span>
            {entryCount} {entryCount === 1 ? "entry" : "entries"}
          </span>
        ) : null}
        {updatedISO ? <span>updated {formatAbsoluteDate(updatedISO)}</span> : null}
        {/* Keyboard-nav discoverability — archive only (where entryCount is set). */}
        {typeof entryCount === "number" ? (
          <span
            className="kbd-hint"
            title="Keyboard: ↑↓ or j/k move between entries, Enter opens, Esc returns"
          >
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate · <kbd>↵</kbd> open
          </span>
        ) : null}
      </div>
      <div className="site-footer-end">
        <nav className="site-footer-links" aria-label="Site links">
          <a href="https://stillinlove.co" className="site-footer-link">
            About
          </a>
          <a href="/feed.xml" className="site-footer-link">
            RSS
          </a>
          <a href="https://studio.stillinlove.co" className="site-footer-link">
            Studio →
          </a>
        </nav>
        <ThemeToggle />
      </div>
    </footer>
  );
}
