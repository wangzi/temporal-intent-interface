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

// onOpen receives the clicked stone's rect so the parent can fly a
// matching stone from here into the review sheet (FLIP).
export function GoBoard({
  onOpen,
}: {
  onOpen: (family: Family, rect: DOMRect) => void;
}) {
  return (
    <div className="go" role="group" aria-label="Review the moves">
      <div className="go-grid" aria-hidden="true" />
      <button
        type="button"
        className="go-stone go-stone--black"
        onClick={(e) =>
          onOpen("machine", e.currentTarget.getBoundingClientRect())
        }
        aria-label="Open the review — the machine’s move, 37"
      >
        <span className="go-num" aria-hidden="true">37</span>
      </button>
      <button
        type="button"
        className="go-stone go-stone--white"
        onClick={(e) =>
          onOpen("human", e.currentTarget.getBoundingClientRect())
        }
        aria-label="Open the review — the human’s move, 78"
      >
        <span className="go-num" aria-hidden="true">78</span>
      </button>
    </div>
  );
}
