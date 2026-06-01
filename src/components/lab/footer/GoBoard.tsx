"use client";

// The trigger — two Go stones on a faint corner lattice, fixed at the
// bottom-right. No label (the stones are the invitation). Black = the
// machine's move (37); white = the human's move (78). Both open the
// same review sheet; the stone clicked just frames which family of
// moves the sheet emphasises.
//
// The lattice + stones are circles and hairlines only — the same
// vocabulary as the reader's red dot and spine, in grayscale. The one
// red accent is NOT used here; these are black/white Go stones.

type Family = "machine" | "human";

export function GoBoard({ onOpen }: { onOpen: (family: Family) => void }) {
  return (
    <div className="go" role="group" aria-label="Review the moves">
      <div className="go-grid" aria-hidden="true" />
      <button
        type="button"
        className="go-stone go-stone--black"
        onClick={() => onOpen("machine")}
        aria-label="Open the review — the machine’s move, 37"
      >
        <span className="go-num" aria-hidden="true">37</span>
      </button>
      <button
        type="button"
        className="go-stone go-stone--white"
        onClick={() => onOpen("human")}
        aria-label="Open the review — the human’s move, 78"
      >
        <span className="go-num" aria-hidden="true">78</span>
      </button>
    </div>
  );
}
