"use client";

// Footer with a live view-switch — the simplest version of the idea.
//
// The footer always shows its content (threads / ask / colophon) in the
// current style. Tapping the board at the foot of the spine cycles the
// style — Column → Index → Spine — and the footer re-renders in place.
// No panel, no sheet, no "opening / move" jargon: the board IS the switch,
// and the footer itself is the preview. Tap, see it change.
//
// SSR + JS-off (Hard Rule §17.4): this client component still SSRs its
// initial markup, so a reader with JS disabled gets the full default
// footer (Column). The switch is client-only (gated behind `mounted`) —
// the static HTML carries no dead control.

import { useEffect, useState } from "react";

import { FooterColumn } from "@/components/lab/footer/FooterColumn";
import { FooterIndex } from "@/components/lab/footer/FooterIndex";
import { FooterSpine } from "@/components/lab/footer/FooterSpine";
import { DEFAULT_MOVES, type Opening } from "@/lib/lab/footer-data";
import type { PostSummary } from "@/lib/engine/types";

const VIEWS: { id: Opening; label: string }[] = [
  { id: "column", label: "Column" },
  { id: "index", label: "Index" },
  { id: "spine", label: "Spine" },
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

      {/* Studio bridge — right-aligned at the bottom. Rendered here (not
          client-gated) so it's in the SSR HTML and reachable JS-off. */}
      <a
        className="footer-studio mono"
        href="https://studio.stillinlove.co"
      >
        Studio / Sign in →
      </a>

      {mounted ? (
        <button
          type="button"
          className="go-switch"
          onClick={() => setView(next.id)}
          aria-label={`Footer style: ${current.label}. Tap to switch to ${next.label}.`}
          title="Tap to switch the footer style"
        >
          <span className="go-grid" aria-hidden="true" />
          <span className="go-stone go-stone--black" aria-hidden="true" />
          <span className="go-stone go-stone--white" aria-hidden="true" />
          <span className="go-switch-cap mono" aria-hidden="true">
            <span className="go-switch-now">{current.label}</span>
            <span className="go-switch-hint">tap to switch</span>
          </span>
        </button>
      ) : null}
    </>
  );
}
