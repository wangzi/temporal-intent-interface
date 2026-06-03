// Terminal hero — the head of the spine. A CLI-style status readout that
// replaces the old sort-toggle masthead. Three lines:
//   1. `> ` prompt + a LIVE local clock (client-only; empty in SSR).
//   2. `Last entry N days ago, M total entries` — server data, present in the
//      SSR HTML so JS-off readers get it.
//   3. a down arrow `↓` — a scroll hint (bounces via CSS; static under
//      prefers-reduced-motion and JS-off).
//
// This markup IS the JS-off-complete final state (PRD §17.4). TerminalHeroIsland
// enhances it: it clears + retypes lines 1–2 behind a blinking caret, then
// reveals the bouncing arrow. The clock line is the one client-only piece; its
// row height is reserved in CSS so its post-mount arrival causes no layout
// shift. See globals.css `.hero-term*`.
//
// The visible line-2 text and `data-hero-final` are byte-identical, so the
// SSR render and the animated end state match (no hydration mismatch, and the
// island has an exact retype source even after it clears the visible text).

export function TerminalHero({
  lastEntryDays,
  totalEntriesCount,
}: {
  lastEntryDays: number;
  totalEntriesCount: number;
}) {
  const dataLine = `Last entry ${lastEntryDays} ${
    lastEntryDays === 1 ? "day" : "days"
  } ago, ${totalEntriesCount} total ${
    totalEntriesCount === 1 ? "entry" : "entries"
  }`;

  return (
    <div className="hero-term mono" data-hero-root>
      {/* line 1 — prompt + live local clock. Clock slot is empty in SSR; the
          island writes it post-mount. aria-hidden: decorative time. */}
      <div className="hero-term-line" aria-hidden="true">
        <span className="hero-term-prompt">&gt;&nbsp;</span>
        <span
          className="hero-term-clock"
          data-hero-clock
          suppressHydrationWarning
        />
      </div>

      {/* line 2 — server data string. Readable by assistive tech and present
          in SSR for JS-off. data-hero-final is the island's retype source. */}
      <div className="hero-term-line">
        <span className="hero-term-data" data-hero-final={dataLine}>
          {dataLine}
        </span>
      </div>

      {/* line 3 — scroll hint. Static ↓ in SSR (JS-off sees it); the island
          hides it during typing, then reveals it bouncing. */}
      <div className="hero-term-line hero-term-hint" aria-hidden="true">
        <span className="hero-term-cursor" data-hero-cursor>
          ↓
        </span>
      </div>
    </div>
  );
}
