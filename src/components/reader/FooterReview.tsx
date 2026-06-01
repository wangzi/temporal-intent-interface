"use client";

// Production footer-review — the Go board promoted out of the lab into
// the real reader footer (mounted on / and /post/[slug]).
//
// What it does, and the constraints it respects:
//
// • The active variant IS the real footer. There is no "stage" wrapper
//   (that was the lab). The chosen opening renders in place at the page
//   bottom; the spine terminates on its top rule.
//
// • SSR + JS-off (Hard Rule §17.4). This is a client component, so Next
//   still server-renders its initial markup: the DEFAULT opening
//   (Closing column) with the default moves. A reader with JS disabled
//   gets a complete, real footer — just not the board.
//
// • The board is client-only (gated behind `mounted`) so the SSR HTML
//   carries no dead button; the stones appear once JS hydrates.
//
// • Session-only, per-page (decision A1): position lives in local state.
//   No store, no storage, no URL params. Navigating to another post
//   boots fresh into the default — that is the intended "a session is
//   this reading" feel.
//
// • Live but hidden → mini-preview. The sheet covers the bottom ~42vh
//   where the footer sits, so we render a non-interactive miniature of
//   the current position at the top of the sheet. Toggling a move shows
//   its effect on the whole board immediately, the way reviewing a Go
//   game replays the position.
//
// The stone-travel (FLIP) is identical to the lab: clicking a board
// stone flies a matching stone into the sheet header as the sheet rises.

import { useEffect, useRef, useState } from "react";

import { GoBoard } from "@/components/lab/footer/GoBoard";
import { ReviewSheet } from "@/components/lab/footer/ReviewSheet";
import { FooterColumn } from "@/components/lab/footer/FooterColumn";
import { FooterIndex } from "@/components/lab/footer/FooterIndex";
import { FooterSpine } from "@/components/lab/footer/FooterSpine";
import {
  DEFAULT_MOVES,
  type FooterMoves,
  type Opening,
} from "@/lib/lab/footer-data";
import type { PostSummary } from "@/lib/engine/types";

type Family = "machine" | "human";

const VARIANTS = {
  column: FooterColumn,
  index: FooterIndex,
  spine: FooterSpine,
} as const;

// Closing column is the default opening — the quietest, most "z." footer,
// the one the page boots into and JS-off readers receive.
const DEFAULT_OPENING: Opening = "column";

const FLY_MS = 420;

export function FooterReview({ posts }: { posts: PostSummary[] }) {
  const [opening, setOpening] = useState<Opening>(DEFAULT_OPENING);
  const [moves, setMoves] = useState<FooterMoves>(DEFAULT_MOVES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [family, setFamily] = useState<Family>("human");
  const [played, setPlayed] = useState<Family | null>(null);
  // Board is client-only: false during SSR so the static HTML has no
  // dead trigger; flips true after hydration.
  const [mounted, setMounted] = useState(false);

  const flyRef = useRef<HTMLSpanElement>(null);

  const Variant = VARIANTS[opening];

  useEffect(() => setMounted(true), []);

  function reduced(): boolean {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function open(f: Family, fromRect: DOMRect): void {
    setFamily(f);

    const fly = flyRef.current;
    const sheetEl = document.querySelector<HTMLElement>(".sheet");
    const slot = document.querySelector<HTMLElement>("[data-played-slot]");

    // Degrade: no flight — the header stone just appears.
    if (reduced() || !fly || !sheetEl || !slot) {
      setSheetOpen(true);
      setPlayed(f);
      return;
    }

    // Derive the slot's OPEN position from its closed rect (the sheet is
    // translateY(100%) closed, so subtract the sheet height).
    const sheetH = sheetEl.offsetHeight;
    const slotRect = slot.getBoundingClientRect();
    const toX = slotRect.left + slotRect.width / 2;
    const toY = slotRect.top - sheetH + slotRect.height / 2;
    const fromX = fromRect.left + fromRect.width / 2;
    const fromY = fromRect.top + fromRect.height / 2;

    // First: place the fly stone over the clicked board stone.
    fly.dataset.color = f;
    fly.style.transition = "none";
    fly.style.opacity = "1";
    fly.style.left = `${fromX}px`;
    fly.style.top = `${fromY}px`;
    fly.style.width = `${fromRect.width}px`;
    fly.style.height = `${fromRect.height}px`;

    setPlayed(null); // header stone hidden until the flight lands
    setSheetOpen(true); // sheet starts rising

    // Play: next frame, transition the fly stone to the header slot.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fly.style.transition = `left ${FLY_MS}ms var(--ease), top ${FLY_MS}ms var(--ease), width ${FLY_MS}ms var(--ease), height ${FLY_MS}ms var(--ease)`;
        fly.style.left = `${toX}px`;
        fly.style.top = `${toY}px`;
        fly.style.width = "13px";
        fly.style.height = "13px";
      });
    });

    window.setTimeout(() => {
      if (flyRef.current) flyRef.current.style.opacity = "0";
      setPlayed(f);
    }, FLY_MS + 20);
  }

  return (
    <>
      {/* The active variant IS the real footer. */}
      <Variant posts={posts} moves={moves} />

      {mounted ? <GoBoard onOpen={open} /> : null}

      <ReviewSheet
        open={sheetOpen}
        opening={opening}
        moves={moves}
        family={family}
        played={played}
        preview={<Variant posts={posts} moves={moves} />}
        onOpening={setOpening}
        onToggle={(k) => setMoves((m) => ({ ...m, [k]: !m[k] }))}
        onClose={() => setSheetOpen(false)}
      />

      {/* The flying stone (FLIP). Lives at document level, fixed. */}
      <span ref={flyRef} className="go-fly" aria-hidden="true" />
    </>
  );
}
