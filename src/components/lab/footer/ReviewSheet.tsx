"use client";

// The review — a white sheet that slides up ~42vh. No shadow, no line:
// it separates from the field by a tonal step (pure #fff over the
// #fcfcfa field) plus a barely-there scrim. Inside, the moves are
// played as stones (filled = on, outline = off). One OPENING (layout)
// chosen like an opening; the MOVES (features) placed freely. Two moves
// carry the numbers 37 (machine, the ask) and 78 (human, the threads) —
// the same two stones as the board outside.
//
// Session-only state lives in the parent island; this is pure control.

import { useEffect, useRef } from "react";

import type { FooterMoves, Opening } from "@/lib/lab/footer-data";

type Family = "machine" | "human";

const OPENINGS: { id: Opening; label: string }[] = [
  { id: "column", label: "Closing column" },
  { id: "index", label: "The Index" },
  { id: "spine", label: "Spine annotations" },
];

const MOVES: {
  key: keyof FooterMoves;
  num?: string;
  family?: Family;
  label: string;
  gloss: string;
}[] = [
  {
    key: "threads",
    num: "78",
    family: "human",
    label: "Open threads",
    gloss: "the questions still turning over",
  },
  {
    key: "ask",
    num: "37",
    family: "machine",
    label: "Ask the archive",
    gloss: "query the corpus, get entries + the why",
  },
  { key: "colophon", label: "Colophon", gloss: "provenance + corpus stats" },
];

export function ReviewSheet({
  open,
  opening,
  moves,
  family,
  played,
  onOpening,
  onToggle,
  onClose,
}: {
  open: boolean;
  opening: Opening;
  moves: FooterMoves;
  family: Family;
  /** Which stone has landed in the header (null until the fly finishes). */
  played: Family | null;
  onOpening: (o: Opening) => void;
  onToggle: (k: keyof FooterMoves) => void;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLElement>(null);

  // Esc closes; focus moves into the sheet on open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    sheetRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`sheet-scrim${open ? " is-open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <section
        ref={sheetRef}
        className={`sheet${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Review — choose the moves"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className="sheet-inner">
          <div className="sheet-head">
            <span className="sheet-head-left">
              {/* The stone played from the board lands here (FLIP target). */}
              <span
                data-played-slot
                className={`sheet-played${
                  played ? ` is-${played}` : ""
                }`}
                aria-hidden="true"
              />
              <span className="sheet-title mono">review</span>
            </span>
            <button
              type="button"
              className="sheet-close mono"
              onClick={onClose}
              aria-label="Close review (esc)"
            >
              esc
            </button>
          </div>

          <div className="sheet-section">
            <p className="sheet-kicker mono">opening</p>
            <div className="sheet-openings" role="radiogroup" aria-label="Opening">
              {OPENINGS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={opening === o.id}
                  className={`move${opening === o.id ? " is-on" : ""}`}
                  onClick={() => onOpening(o.id)}
                >
                  <span className="move-stone" aria-hidden="true" />
                  <span className="move-label">{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-section">
            <p className="sheet-kicker mono">moves</p>
            <ul className="sheet-moves">
              {MOVES.map((m) => (
                <li key={m.key}>
                  <button
                    type="button"
                    aria-pressed={moves[m.key]}
                    className={`move move--row${moves[m.key] ? " is-on" : ""}${
                      m.family && m.family === family ? " is-framed" : ""
                    }`}
                    onClick={() => onToggle(m.key)}
                  >
                    <span className="move-stone" aria-hidden="true" />
                    <span className="move-label">
                      {m.num ? <em className="move-num">{m.num}</em> : null}
                      {m.label}
                    </span>
                    <span className="move-gloss">{m.gloss}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
