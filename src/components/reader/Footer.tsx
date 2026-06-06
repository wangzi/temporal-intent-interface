// SSR site footer — the spine's terminal zone. The timeline (.spine) runs
// down into this footer's top edge, so the footer reads as the line's foot.
// It carries the Studio bridge: "Studio / Sign in →" links to journalkit's
// authoring surface (studio.stillinlove.co), sitting at the end of the spine.
// Server component — part of the SSR'd HTML, so it works with JS off.

export function Footer(_props: {
  entryCount?: number;
  updatedISO?: string | null;
}) {
  return (
    <footer className="site-footer mono" aria-label="Site footer">
      <a className="site-footer-studio" href="https://studio.stillinlove.co">
        Studio / Sign in <span aria-hidden="true">→</span>
      </a>
      <span className="site-footer-est">Est. 2021</span>
    </footer>
  );
}
