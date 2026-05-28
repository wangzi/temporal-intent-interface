export default function About() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 leading-relaxed">
      <div className="flex items-baseline justify-between">
        <a href="/" className="text-lg">z<span style={{ color: "var(--accent)" }}>.</span></a>
        <a href="/" className="text-sm hover:text-[var(--accent)]" style={{ color: "var(--muted)" }}>./home</a>
      </div>

      <div className="my-8" style={{ color: "var(--rule)" }}>
        ────────────────────────────────────────────────
      </div>

      <p className="text-sm">
        <span style={{ color: "var(--accent)" }}>&gt; cat about.md</span>
      </p>
      <h1 className="mt-4 text-2xl">who is z.</h1>
      <div className="mt-5 space-y-4">
        <p>
          a placeholder for the standing introduction. in the admin console this page becomes
          configurable per audience — friends, family, an interview, an investor conversation —
          each at its own shareable url.
        </p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          this is design mock copy. the real text, and the audience variants, get authored later.
        </p>
      </div>

      <div className="my-10" style={{ color: "var(--rule)" }}>
        ────────────────────────────────────────────────
      </div>
      <footer className="text-sm" style={{ color: "var(--muted)" }}>
        <a href="/" className="hover:text-[var(--accent)]">./home</a>
      </footer>
    </main>
  );
}
