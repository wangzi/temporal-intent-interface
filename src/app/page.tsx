"use client";

import { useState } from "react";

type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  pinned?: boolean;
};

const POSTS: Post[] = [
  { slug: "on-building-quietly", title: "On building quietly", date: "2026-05-20", excerpt: "Why I stopped announcing things before they were real.", pinned: true },
  { slug: "a-week-in-sf", title: "A week in SF", date: "2026-05-18", excerpt: "Fog, old friends, and the strange comfort of a city that forgets you." },
  { slug: "the-shape-of-a-good-morning", title: "The shape of a good morning", date: "2026-05-11", excerpt: "Coffee, no phone, and the first hour that belongs to no one." },
  { slug: "shipping-halftime", title: "What I learned shipping Halftime", date: "2026-04-29", excerpt: "Six lessons from a year of building for families." },
  { slug: "letters-i-didnt-send", title: "Letters I didn't send", date: "2026-04-15", excerpt: "Some things get clearer when you write them only for yourself." },
  { slug: "beginning-again", title: "Beginning again", date: "2026-04-01", excerpt: "The first entry — a note on why this exists." },
];

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const pinned = POSTS.find((p) => p.pinned);
  const rest = POSTS.filter((p) => !p.pinned).sort((a, b) =>
    order === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  );

  return (
    <main className="mx-auto max-w-[42rem] px-6 py-16 sm:py-24">
      <header className="mb-12">
        <div className="flex items-baseline justify-between">
          <a href="/" className="text-2xl tracking-tight">z<span style={{ color: "var(--accent)" }}>.</span></a>
          <nav className="text-sm" style={{ color: "var(--muted)" }}>
            <a href="/about" className="hover:text-[var(--ink)]">About</a>
          </nav>
        </div>
        <p className="mt-4 text-[0.95rem] italic leading-relaxed" style={{ color: "var(--muted)" }}>
          Now — building journalkit, mostly from New York. Reading <em>Gilead</em>. Open to good conversations.
        </p>
        <div className="mt-8 h-px w-full" style={{ background: "var(--rule)" }} />
      </header>

      {pinned && (
        <article className="mb-14">
          <div className="mb-3 text-[0.7rem] uppercase tracking-[0.25em]" style={{ color: "var(--accent)" }}>
            Pinned
          </div>
          <a href={`/post/${pinned.slug}`} className="group block">
            <h2 className="text-[2rem] leading-[1.15] tracking-tight group-hover:underline decoration-1 underline-offset-4">
              {pinned.title}
            </h2>
            <p className="mt-3 text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
              {pinned.excerpt}
            </p>
            <div className="mt-3 text-sm" style={{ color: "var(--muted)" }}>{fmt(pinned.date)}</div>
          </a>
        </article>
      )}

      <div className="mb-6 flex items-baseline justify-between border-t pt-6" style={{ borderColor: "var(--rule)" }}>
        <h3 className="text-[0.7rem] uppercase tracking-[0.25em]" style={{ color: "var(--muted)" }}>Writing</h3>
        <div className="flex gap-3 text-[0.8rem]">
          {(["newest", "oldest"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOrder(o)}
              className="capitalize transition-colors"
              style={{ color: order === o ? "var(--ink)" : "var(--muted)", textDecoration: order === o ? "underline" : "none", textUnderlineOffset: "4px" }}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-9">
        {rest.map((p) => (
          <li key={p.slug}>
            <a href={`/post/${p.slug}`} className="group block">
              <div className="text-sm" style={{ color: "var(--muted)" }}>{fmt(p.date)}</div>
              <h2 className="mt-1 text-xl leading-snug tracking-tight group-hover:underline decoration-1 underline-offset-4">
                {p.title}
              </h2>
              <p className="mt-1.5 leading-relaxed" style={{ color: "var(--muted)" }}>{p.excerpt}</p>
            </a>
          </li>
        ))}
      </ul>

      <footer className="mt-20 border-t pt-6 text-sm" style={{ borderColor: "var(--rule)", color: "var(--muted)" }}>
        <a href="/about" className="hover:text-[var(--ink)]">About</a>
        <span className="mx-3">·</span>
        <a href="https://stillinlove.co" className="hover:text-[var(--ink)]">stillinlove.co</a>
      </footer>
    </main>
  );
}
