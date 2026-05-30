// Fixed attention marker. CSS-positioned at `top: 40vh`,
// `left: var(--spine-x)` so it lands at the right place without
// JavaScript. JS-off readers see the dot in the correct location;
// JS-on, ReaderControlsIsland (step 5+) precision-positions it via
// the spine's getBoundingClientRect().
//
// Decorative — aria-hidden. The dot is not focusable.

export function Dot() {
  return <span className="dot" id="dot" aria-hidden="true" />;
}
