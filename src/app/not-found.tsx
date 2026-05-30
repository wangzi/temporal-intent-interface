import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p
        className="mono"
        style={{
          fontSize: "0.6875rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--system-faint)",
          marginBottom: "12px",
        }}
      >
        404
      </p>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontSize: "var(--t-title-read)",
          lineHeight: 1.12,
          color: "var(--ink)",
          marginBottom: "20px",
        }}
      >
        Not here.
      </h1>
      <Link
        href="/"
        className="mono"
        style={{
          fontSize: "0.8125rem",
          letterSpacing: "0.04em",
          color: "var(--system)",
        }}
      >
        ← back
      </Link>
    </main>
  );
}
