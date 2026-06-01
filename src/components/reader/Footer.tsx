// Footer placeholder zone (~300px tall). Reserved space for future
// footer content; today it carries the single required bridge to the
// studio at studio.stillinlove.co — the author chrome lives there,
// not here (PRD §10).
//
// Height is driven by --footer-h in globals.css; the reader spine
// terminates exactly at this footer's top edge.
//
// Server component. Renders as part of the SSR'd HTML.

export function Footer() {
  return (
    <footer className="site-footer" aria-label="Site footer">
      <a href="https://studio.stillinlove.co" className="site-footer-link mono">
        Studio / Sign in →
      </a>
    </footer>
  );
}
