// Step 1 — scaffold placeholder. Real archive route lands in Step 3.
// Verifies: fonts load, design tokens apply, build pipeline works.
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <p
        className="mono"
        style={{
          fontSize: "0.6875rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--system-faint)",
          marginBottom: "32px",
        }}
      >
        Phase B · scaffolding
      </p>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontSize: "var(--t-title-read)",
          lineHeight: 1.12,
          letterSpacing: "-0.015em",
          color: "var(--ink)",
          marginBottom: "24px",
        }}
      >
        z<span style={{ color: "var(--dot)" }}>.</span>
      </h1>
      <p
        style={{
          fontFamily: "var(--serif)",
          fontSize: "var(--t-body)",
          lineHeight: 1.62,
          color: "var(--ink-soft)",
          maxWidth: "var(--measure)",
        }}
      >
        The Temporal Intent Interface is being built. The archive view lands at
        Step 3 of the Phase B scaffold; the post route at Step 4.
      </p>
      <p
        className="mono"
        style={{
          fontSize: "0.75rem",
          color: "var(--system)",
          marginTop: "32px",
        }}
      >
        z.stillinlove.co
      </p>
    </main>
  );
}
