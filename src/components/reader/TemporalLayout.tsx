// Three-track grid shell: [nav rail | reading area | time index].
// Server component; pure markup. Rail and time-index slot widths
// are driven by CSS custom properties that change per breakpoint
// (see globals.css §App shell + breakpoints).
//
// Phase B step 3 renders only the reading column + the static dot;
// nav rail (step 8), top bar (step 11), and time index (step 9)
// slot into `rail` and `timeIndex` props in later steps.

import type { ReactNode } from "react";

export function TemporalLayout({
  topBar,
  rail,
  timeIndex,
  children,
}: {
  topBar?: ReactNode;
  rail?: ReactNode;
  timeIndex?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {/* Skip link — first focusable element; SSR, visible only on focus. */}
      <a href="#reader-main" className="skip-link">
        Skip to content
      </a>
      {topBar}
      {/* Rail toggle — a black circle (click to expand, click again to
          collapse). CSS-only via a hidden checkbox
          (`.rail-toggle-input:checked ~ .rail`), so it works with JS off.
          Laptop+ only; mobile uses the TopBar hamburger. */}
      <input
        type="checkbox"
        id="rail-toggle"
        className="rail-toggle-input"
        aria-label="Expand navigation menu"
      />
      <label
        htmlFor="rail-toggle"
        className="rail-toggle"
        title="Toggle navigation menu"
      />
      {rail}
      {/* Click-outside-to-collapse: a full-screen label bound to the same
          checkbox, visible only while the rail is open (see globals.css
          `.rail-scrim`). A click outside the rail collapses it. */}
      <label htmlFor="rail-toggle" className="rail-scrim" aria-hidden="true" />
      <div className="app">
        <main className="reader" id="reader-main" tabIndex={-1}>
          <div className="col" id="col">
            {children}
          </div>
        </main>
        {timeIndex ?? <nav className="timeindex" aria-hidden="true" />}
      </div>
    </>
  );
}
