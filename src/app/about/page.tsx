export default function About() {
  return (
    <main className="mx-auto max-w-[42rem] px-6 py-16 sm:py-24">
      <a href="/" className="text-2xl tracking-tight">z<span style={{ color: "var(--accent)" }}>.</span></a>
      <div className="mt-12">
        <div className="mb-3 text-[0.7rem] uppercase tracking-[0.25em]" style={{ color: "var(--accent)" }}>
          About
        </div>
        <h1 className="text-[2.25rem] leading-[1.1] tracking-tight">Who is z.</h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed" style={{ color: "var(--ink)" }}>
          <p>
            A placeholder for the standing introduction. In the admin console this page
            becomes configurable per audience — a version for friends, one for family, one
            for an interview, one for an investor conversation — each at its own shareable URL.
          </p>
          <p style={{ color: "var(--muted)" }}>
            This is design mock copy. The real text, and the audience variants, get authored later.
          </p>
        </div>
      </div>
      <footer className="mt-20 border-t pt-6 text-sm" style={{ borderColor: "var(--rule)", color: "var(--muted)" }}>
        <a href="/" className="hover:text-[var(--ink)]">← Home</a>
      </footer>
    </main>
  );
}
