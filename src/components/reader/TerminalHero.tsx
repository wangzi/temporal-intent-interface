// Terminal hero — the head of the spine. A CLI status readout: two text rows
// aligned to the entry column —
//   1. a LIVE local clock (client-only; empty in SSR, height-reserved)
//   2. `Last entry N days ago, M total entries` (server data; in the SSR HTML)
// — plus a SINGLE glyph on the spine that TerminalHeroIsland morphs and
// descends: blinking | (cursor) → > (prompt) → ↓ (scroll hint), travelling down
// the spine as the rows type in.
//
// This markup IS the JS-off-complete final state (PRD §17.4): the glyph ships
// as the rested ↓ and the data row is fully present. Only the clock row is
// client-only, and its height is reserved so its post-mount arrival causes no
// layout shift. The island clears + retypes the rows and drives the glyph; see
// globals.css `.hero-term*` / `.hero-glyph`.

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
      {/* The morphing glyph, on the spine. SSR / JS-off render it as the rested
          ↓ (scroll hint). The island repositions + retypes it to | first. */}
      <span className="hero-glyph" data-hero-glyph aria-hidden="true">
        ↓
      </span>

      {/* row 1 — live local clock. Empty slot in SSR; the island fills it
          post-mount. aria-hidden: decorative time. */}
      <div className="hero-term-line" data-hero-line="clock" aria-hidden="true">
        <span
          className="hero-term-clock"
          data-hero-clock
          suppressHydrationWarning
        />
      </div>

      {/* row 2 — server data string. Readable by assistive tech and present in
          SSR for JS-off. data-hero-final is the island's retype source. */}
      <div className="hero-term-line" data-hero-line="data">
        <span className="hero-term-data" data-hero-final={dataLine}>
          {dataLine}
        </span>
      </div>
    </div>
  );
}
