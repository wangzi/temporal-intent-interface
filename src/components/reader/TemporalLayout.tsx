// The READER shell. Server component; pure markup.
//
// Structurally it is: skip link → top bar → a CSS-only rail disclosure
// (checkbox + fixed overlay drawer + scrim) → the centred reading column.
//
// It is declared as a three-track grid [rail | reading area | time index], but
// both side tracks are vestigial: --rail-w and --index-w are 0px at every
// breakpoint and `.timeindex` carries no CSS, so the grid computes to
// `0 1fr 0` everywhere. The rail is an overlay, not a track.
//
// This shell is reader-specific — `.reader` hard-codes top padding for the
// fixed TopBar and `.col` caps at the ~66ch prose measure. A non-reader surface
// should NOT reuse it; render a bare <main> instead (see /s/[token]).

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
      {/* Rail toggle — opens/collapses the rail (LensRail: search, focus
          routes, sort). CSS-only via this hidden checkbox
          (`.rail-toggle-input:checked ~ .rail`), so it works with JS off and is
          keyboard-focusable. Laptop+: a disc in the left margin; mobile/tablet:
          a bottom-right thumb-zone button (see globals.css `.rail-toggle`). */}
      <input
        type="checkbox"
        id="rail-toggle"
        className="rail-toggle-input"
        aria-label="Navigation menu"
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
