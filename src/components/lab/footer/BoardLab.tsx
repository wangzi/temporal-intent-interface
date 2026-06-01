"use client";

// The live wiring. Holds the session-only position (one opening + the
// placed moves) in local state — no store, no persistence. The active
// variant renders in the visible "stage"; the Go board (fixed
// bottom-right) opens the review sheet; toggling a move reconfigures
// the stage live.
//
// Stone-travel (FLIP): clicking a board stone flies a matching stone
// from the board into the sheet header as the sheet rises — the
// Move-37 "placement" beat. Source rect is measured at click; the
// header target's OPEN position is derived from its closed rect minus
// the sheet height (the sheet is translateY(100%) when closed), so no
// transition timing needs to be awaited. prefers-reduced-motion skips
// the flight and the header stone simply appears.

import { useRef, useState } from "react";

import { GoBoard } from "./GoBoard";
import { ReviewSheet } from "./ReviewSheet";
import { FooterColumn } from "./FooterColumn";
import { FooterIndex } from "./FooterIndex";
import { FooterSpine } from "./FooterSpine";
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

const FLY_MS = 420;

export function BoardLab({ posts }: { posts: PostSummary[] }) {
  const [opening, setOpening] = useState<Opening>("column");
  const [moves, setMoves] = useState<FooterMoves>(DEFAULT_MOVES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [family, setFamily] = useState<Family>("human");
  const [played, setPlayed] = useState<Family | null>(null);

  const flyRef = useRef<HTMLSpanElement>(null);

  const Variant = VARIANTS[opening];

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
      <section className="stage" aria-label="Current position">
        <p className="stage-tag mono">current position</p>
        <Variant posts={posts} moves={moves} />
      </section>

      <GoBoard onOpen={open} />

      <ReviewSheet
        open={sheetOpen}
        opening={opening}
        moves={moves}
        family={family}
        played={played}
        onOpening={setOpening}
        onToggle={(k) => setMoves((m) => ({ ...m, [k]: !m[k] }))}
        onClose={() => setSheetOpen(false)}
      />

      {/* The flying stone (FLIP). Lives at document level, fixed. */}
      <span ref={flyRef} className="go-fly" aria-hidden="true" />
    </>
  );
}
