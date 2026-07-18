// SSR site footer — the spine's terminal zone. The timeline (.spine) runs down
// into this footer's top edge, so it reads as the line's foot: a minimal shell
// prompt (`zw@z:~$`) whose "typed command" is the outbound links (LinkedIn, IG,
// and the Studio bridge), trailed by a blinking cursor. Server component — part
// of the SSR'd HTML, so it works with JS off (the cursor just stops blinking).

export function Footer() {
  // `mono` sits on the children, not the <footer>: the element's own font
  // decides how `--measure` (66ch) computes, and the post-route footer has to
  // resolve the SAME column width as the article to land on the spine.
  return (
    <footer className="site-footer" aria-label="Site footer">
      <span className="site-footer-cli mono">
        <span className="site-footer-prompt" aria-hidden="true">
          zw@z:~$
        </span>
        {/* Internal, so no ↗ — the arrow marks links that leave the site. The
            footer is the only sitewide off-surface affordance, so /resume is
            reachable from every page without inventing a new nav concept. */}
        <a className="site-footer-cmd" href="/resume">
          resume
        </a>
        <a
          className="site-footer-cmd"
          href="https://www.linkedin.com/in/wzi/"
          target="_blank"
          rel="me noopener noreferrer"
          aria-label="LinkedIn profile (opens in a new tab)"
        >
          linkedin
          <span className="site-footer-arrow" aria-hidden="true">
            ↗
          </span>
        </a>
        <a
          className="site-footer-cmd"
          href="https://www.instagram.com/yo.zi.ira/"
          target="_blank"
          rel="me noopener noreferrer"
          aria-label="Instagram profile (opens in a new tab)"
        >
          IG
          <span className="site-footer-arrow" aria-hidden="true">
            ↗
          </span>
        </a>
        <a className="site-footer-cmd" href="https://studio.stillinlove.co">
          studio
          <span className="site-footer-arrow" aria-hidden="true">
            ↗
          </span>
          <span className="site-footer-cursor" aria-hidden="true">
            ▮
          </span>
        </a>
      </span>
      <span className="site-footer-est mono">boot: 2016</span>
    </footer>
  );
}
