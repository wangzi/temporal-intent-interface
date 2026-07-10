// SSR site footer — the spine's terminal zone. The timeline (.spine) runs down
// into this footer's top edge, so it reads as the line's foot: a minimal shell
// prompt (`zw@z:~$`) whose "typed command" is the outbound links (LinkedIn +
// the Studio bridge), trailed by a blinking cursor. Server component — part of
// the SSR'd HTML, so it works with JS off (the cursor just stops blinking).

export function Footer(_props: {
  entryCount?: number;
  updatedISO?: string | null;
}) {
  return (
    <footer className="site-footer mono" aria-label="Site footer">
      <span className="site-footer-cli">
        <span className="site-footer-prompt" aria-hidden="true">
          zw@z:~$
        </span>
        <a
          className="site-footer-cmd"
          href="https://www.linkedin.com/in/wzi/"
          target="_blank"
          rel="me noopener noreferrer"
          aria-label="LinkedIn profile (opens in a new tab)"
        >
          linkedin<span className="site-footer-arrow" aria-hidden="true">↗</span>
        </a>
        <a className="site-footer-cmd" href="https://studio.stillinlove.co">
          studio<span className="site-footer-arrow" aria-hidden="true">↗</span>
          <span className="site-footer-cursor" aria-hidden="true">
            ▮
          </span>
        </a>
      </span>
      <span className="site-footer-est">boot: 2016</span>
    </footer>
  );
}
