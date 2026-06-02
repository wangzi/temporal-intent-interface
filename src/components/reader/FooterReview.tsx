"use client";

// Footer with a live view-switch — one quiet trigger, no stones.
//
// The footer shows its content (threads / ask / colophon) in the current
// style; tapping the trigger at the top-right cycles the style
// Column → Index → Spine and the footer re-renders in place. The footer
// itself is the preview.
//
// SSR + JS-off: this client component SSRs the default footer (Column).
// The trigger is client-only (gated on mount) — no dead control in the
// static HTML; the Studio bridge below is server-rendered, so JS-off
// readers still get it.

import { useEffect, useState } from "react";

import { FooterColumn } from "@/components/lab/footer/FooterColumn";
import { FooterIndex } from "@/components/lab/footer/FooterIndex";
import { FooterSpine } from "@/components/lab/footer/FooterSpine";
import { DEFAULT_MOVES, type Opening } from "@/lib/lab/footer-data";
import type { PostSummary } from "@/lib/engine/types";

const VIEWS: { id: Opening; label: string }[] = [
  { id: "column", label: "column" },
  { id: "index", label: "index" },
  { id: "spine", label: "spine" },
];

const VARIANTS = {
  column: FooterColumn,
  index: FooterIndex,
  spine: FooterSpine,
} as const;

export function FooterReview({ posts }: { posts: PostSummary[] }) {
  const [view, setView] = useState<Opening>("column");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const Variant = VARIANTS[view];
  const i = VIEWS.findIndex((v) => v.id === view);
  const current = VIEWS[i] ?? VIEWS[0]!;
  const next = VIEWS[(i + 1) % VIEWS.length]!;

  return (
    <>
      {/* The footer is the content AND the preview. */}
      <Variant posts={posts} moves={DEFAULT_MOVES} />

      {/* Simple trigger — cycles the style on tap. */}
      {mounted ? (
        <button
          type="button"
          className="footer-switch mono"
          onClick={() => setView(next.id)}
          aria-label={`Footer style: ${current.label}. Tap to switch to ${next.label}.`}
        >
          <svg
            className="footer-switch-icon"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-2.6-6.4" />
            <path d="M21 3v5h-5" />
          </svg>
          <span className="footer-switch-label">{current.label}</span>
        </button>
      ) : null}

      {/* Studio bridge — right-aligned at the foot of the page. Server-
          rendered so it's in the SSR HTML and reachable JS-off. */}
      <a className="footer-studio mono" href="https://studio.stillinlove.co">
        Studio / Sign in →
      </a>
    </>
  );
}
