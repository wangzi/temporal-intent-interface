// Quiet footer at the bottom of every reader page. Single bridge to
// the studio at studio.stillinlove.co — the author chrome lives there,
// not here (PRD §10).
//
// Server component. Renders as part of the SSR'd HTML.

export function Footer() {
  return (
    <footer
      style={{
        padding: "60px var(--content-pad) 40px",
        fontFamily: "var(--mono)",
        fontSize: "0.6875rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--system-faint)",
        borderTop: "1px solid var(--rule)",
        marginTop: "40vh",
      }}
    >
      <a
        href="https://studio.stillinlove.co"
        style={{ color: "var(--system)" }}
      >
        Studio / Sign in →
      </a>
    </footer>
  );
}
