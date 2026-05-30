// Vertical time line. Decorative — aria-hidden. The end-cap dot at
// the bottom is rendered via the CSS pseudo-element `.spine::after`
// (see globals.css).
//
// On JS-on, ReaderControlsIsland (step 5+) reads this element's
// bounding box to position the fixed dot horizontally; on JS-off,
// CSS `top: 40vh` keeps the dot anchored without any JS work.

export function Spine() {
  return <div className="spine" aria-hidden="true" />;
}
