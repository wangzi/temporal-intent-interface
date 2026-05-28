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

function kicker(d: string) {
  return new Date(d + "T00:00:00")
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

export default function Home() {
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const pinned = POSTS.find((p) => p.pinned);
  const rest = POSTS.filter((p) => !p.pinned).sort((a, b) =>
    order === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  );

  return (
    <main className="mx-auto max-w-6xl px-6">
      <header className="flex items-center justify-between py-6">
        <a href="/" className="text-2xl font-bold tracking-tight">z<span style={{ color: "var(--accent)" }}>.</span></a>
        <nav className="flex gap-7 text-[0.7rem] font-medium uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
          <a href="/" className="hover:text-[var(--ink)]">Journal</a>
          <a href="/about" className="hover:text-[var(--ink)]">About</a>
          <a href="/" className="hover:text-[var(--ink)]">Now</a>
        </nav>
      </header>

      <div className="border-y py-2 text-[0.7rem] uppercase tracking-[0.2em]" style={{ borderColor: "var(--ink)", color: "var(--muted)" }}>
        <span style={{ color: "var(--accent)" }}>Now</span> &nbsp;— building journalkit, mostly from New York · reading Gilead · open to good conversations
      </div>

      {pinned && (
        <a href={`/post/${pinned.slug}`} className="group block border-b py-14" style={{ borderColor: "var(--rule)" }}>
          <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
            <div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.25em]" style={{ color: "var(--accent)" }}>
                Pinned · {kicker(pinned.date)}
              </div>
              <div className="mt-6 text-7xl font-light leading-none" style={{ color: "var(--rule)" }}>01</div>
            </div>
            <div>
              <h1 className="text-[2.75rem] font-bold leading-[1.05] tracking-tight group-hover:text-[var(--accent)] sm:text-6xl">
                {pinned.title}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
                {pinned.excerpt}
              </p>
            </div>
          </div>
        </a>
      )}

      <div className="flex items-baseline justify-between py-6">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.25em]">The Journal</h2>
        <div className="flex gap-4 text-[0.7rem] font-medium uppercase tracking-[0.15em]">
          {(["newest", "oldest"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOrder(o)}
              style={{ color: order === o ? "var(--accent)" : "var(--muted)" }}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <ul className="grid gap-x-10 gap-y-12 pb-20 sm:grid-cols-2">
        {rest.map((p, i) => (
          <li key={p.slug}>
            <a href={`/post/${p.slug}`} className="group block border-t pt-5" style={{ borderColor: "var(--ink)" }}>
              <div className="flex items-baseline justify-between text-[0.7rem] font-medium uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>
                <span>{kicker(p.date)}</span>
                <span>{String(i + 2).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-3 text-2xl font-bold leading-tight tracking-tight group-hover:text-[var(--accent)]">
                {p.title}
              </h3>
              <p className="mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{p.excerpt}</p>
            </a>
          </li>
        ))}
      </ul>

      <footer className="border-t py-8 text-[0.7rem] font-medium uppercase tracking-[0.2em]" style={{ borderColor: "var(--ink)", color: "var(--muted)" }}>
        <a href="/about" className="hover:text-[var(--ink)]">About</a>
        <span className="mx-3">·</span>
        <a href="https://stillinlove.co" className="hover:text-[var(--ink)]">stillinlove.co</a>
      </footer>
    </main>
  );
}
