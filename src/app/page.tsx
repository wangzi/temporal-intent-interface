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
  { slug: "on-building-quietly", title: "on building quietly", date: "2026-05-20", excerpt: "why i stopped announcing things before they were real.", pinned: true },
  { slug: "a-week-in-sf", title: "a week in SF", date: "2026-05-18", excerpt: "fog, old friends, and the strange comfort of a city that forgets you." },
  { slug: "the-shape-of-a-good-morning", title: "the shape of a good morning", date: "2026-05-11", excerpt: "coffee, no phone, and the first hour that belongs to no one." },
  { slug: "shipping-halftime", title: "what i learned shipping halftime", date: "2026-04-29", excerpt: "six lessons from a year of building for families." },
  { slug: "letters-i-didnt-send", title: "letters i didn't send", date: "2026-04-15", excerpt: "some things get clearer when you write them only for yourself." },
  { slug: "beginning-again", title: "beginning again", date: "2026-04-01", excerpt: "the first entry — a note on why this exists." },
];

export default function Home() {
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const pinned = POSTS.find((p) => p.pinned);
  const rest = POSTS.filter((p) => !p.pinned).sort((a, b) =>
    order === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 leading-relaxed">
      <header>
        <div className="flex items-baseline justify-between">
          <a href="/" className="text-lg">z<span style={{ color: "var(--accent)" }}>.</span></a>
          <a href="/about" className="text-sm hover:text-[var(--accent)]" style={{ color: "var(--muted)" }}>./about</a>
        </div>
        <p className="mt-4 text-sm">
          <span style={{ color: "var(--accent)" }}>&gt; now:</span>{" "}
          <span style={{ color: "var(--muted)" }}>building journalkit, mostly from NYC · reading gilead · open to good conversations</span>
        </p>
      </header>

      <div className="my-8" style={{ color: "var(--rule)" }}>
        ────────────────────────────────────────────────
      </div>

      {pinned && (
        <a href={`/post/${pinned.slug}`} className="group block">
          <div className="flex gap-3">
            <span className="shrink-0" style={{ color: "var(--muted)" }}>{pinned.date}</span>
            <span className="shrink-0" style={{ color: "var(--accent)" }}>[pinned]</span>
          </div>
          <div className="mt-1 text-lg group-hover:text-[var(--accent)]">{pinned.title}</div>
          <div className="mt-1 pl-0 text-sm" style={{ color: "var(--muted)" }}>{pinned.excerpt}</div>
        </a>
      )}

      <div className="mb-5 mt-10 flex items-center gap-2 text-sm">
        <span style={{ color: "var(--muted)" }}>sort:</span>
        {(["newest", "oldest"] as const).map((o) => (
          <button
            key={o}
            onClick={() => setOrder(o)}
            style={{ color: order === o ? "var(--accent)" : "var(--muted)" }}
          >
            {order === o ? `[${o}]` : o}
          </button>
        ))}
      </div>

      <ul className="space-y-6">
        {rest.map((p) => (
          <li key={p.slug}>
            <a href={`/post/${p.slug}`} className="group block">
              <div className="flex gap-3">
                <span className="shrink-0" style={{ color: "var(--muted)" }}>{p.date}</span>
                <span className="group-hover:text-[var(--accent)]">{p.title}</span>
              </div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>{p.excerpt}</div>
            </a>
          </li>
        ))}
      </ul>

      <div className="my-10" style={{ color: "var(--rule)" }}>
        ────────────────────────────────────────────────
      </div>

      <footer className="text-sm" style={{ color: "var(--muted)" }}>
        <a href="/about" className="hover:text-[var(--accent)]">./about</a>
        <span className="mx-2">·</span>
        <a href="https://stillinlove.co" className="hover:text-[var(--accent)]">stillinlove.co</a>
      </footer>
    </main>
  );
}
