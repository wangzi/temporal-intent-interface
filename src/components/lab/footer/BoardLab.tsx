"use client";

// The live wiring. Holds the session-only position (one opening + the
// placed moves) in local state — no store, no persistence. The active
// variant renders in the visible "stage"; the Go board (fixed
// bottom-right) opens the review sheet; toggling a move reconfigures
// the stage live. This is the reader-facing interaction, mocked in the
// lab so we can tune it before it touches the production footer.

import { useState } from "react";

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

export function BoardLab({ posts }: { posts: PostSummary[] }) {
  const [opening, setOpening] = useState<Opening>("column");
  const [moves, setMoves] = useState<FooterMoves>(DEFAULT_MOVES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [family, setFamily] = useState<Family>("human");

  const Variant = VARIANTS[opening];

  return (
    <>
      <section className="stage" aria-label="Current position">
        <p className="stage-tag mono">current position</p>
        <Variant posts={posts} moves={moves} />
      </section>

      <GoBoard
        onOpen={(f) => {
          setFamily(f);
          setSheetOpen(true);
        }}
      />

      <ReviewSheet
        open={sheetOpen}
        opening={opening}
        moves={moves}
        family={family}
        onOpening={setOpening}
        onToggle={(k) => setMoves((m) => ({ ...m, [k]: !m[k] }))}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
