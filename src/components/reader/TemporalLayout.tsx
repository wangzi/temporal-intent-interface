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
      {topBar}
      {/* Hover trigger for the auto-hide rail at laptop+. Sits as a
          thin invisible strip on the viewport's left edge; hovering
          slides the rail into view via the `.rail-trigger:hover ~ .rail`
          sibling selector in globals.css. */}
      <div className="rail-trigger" aria-hidden="true" />
      {rail}
      <div className="app">
        <main className="reader" id="reader-main">
          <div className="col" id="col">
            {children}
          </div>
        </main>
        {timeIndex ?? <nav className="timeindex" aria-hidden="true" />}
      </div>
    </>
  );
}
