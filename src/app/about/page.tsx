export default function About() {
  return (
    <main className="mx-auto max-w-6xl px-6">
      <header className="flex items-center justify-between py-6">
        <a href="/" className="text-2xl font-bold tracking-tight">z<span style={{ color: "var(--accent)" }}>.</span></a>
        <nav className="flex gap-7 text-[0.7rem] font-medium uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
          <a href="/" className="hover:text-[var(--ink)]">Journal</a>
          <a href="/about" className="text-[var(--ink)]">About</a>
        </nav>
      </header>
      <div className="border-t py-14" style={{ borderColor: "var(--ink)" }}>
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--accent)" }}>About</div>
        <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">Who is z.</h1>
        <div className="mt-8 grid max-w-3xl gap-5 text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
          <p style={{ color: "var(--ink)" }}>
            A placeholder for the standing introduction. In the admin console this page becomes
            configurable per audience — friends, family, an interview, an investor conversation —
            each at its own shareable URL.
          </p>
          <p>This is design mock copy. The real text, and the audience variants, get authored later.</p>
        </div>
      </div>
      <footer className="border-t py-8 text-[0.7rem] font-medium uppercase tracking-[0.2em]" style={{ borderColor: "var(--ink)", color: "var(--muted)" }}>
        <a href="/" className="hover:text-[var(--ink)]">← Home</a>
      </footer>
    </main>
  );
}
