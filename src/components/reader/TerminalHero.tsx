// Terminal hero — the head of the column: a single CLI status row carrying a
// LIVE local clock (client-only; empty in SSR, height-reserved → no CLS). A ✻
// prompt sits on the spine to the left of the row. JS-off shows the ✻ + an
// empty (height-reserved) clock slot; TerminalHeroIsland fills the clock
// post-mount. Decorative time only — aria-hidden.

export function TerminalHero() {
  return (
    <div className="hero-term mono" data-hero-root>
      <div className="hero-term-line" data-hero-line="clock" aria-hidden="true">
        <span className="hero-prompt" data-hero-prompt="clock" aria-hidden="true">
          ✻
        </span>
        <span
          className="hero-term-clock"
          data-hero-clock
          suppressHydrationWarning
        />
      </div>
    </div>
  );
}
