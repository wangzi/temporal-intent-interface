"use client";

// ScrollMagnifier — center-focused vertical scroll with a "magnifying lens"
// effect. The item closest to the vertical center scales toward maxScale;
// items farther away shrink smoothly toward minScale via a Gaussian
// falloff curve. Behaves like a sliding ruler passing under a fixed
// magnifier at the container's vertical centerline.
//
// Reuses the design system in src/app/globals.css:
//   --serif, --ink, --field, --rule, --focus, --ease
// + new `.scroll-magnifier-*` block (search for the matching anchor).
//
// Design choices:
//
//   - Scale + opacity are pushed into CSS custom properties per item via
//     direct style mutation (no React state per item per frame). The
//     CSS rule `transform: scale(var(--scale))` reads the variable so
//     React never re-renders during scroll.
//
//   - The smoothness comes from rAF, not CSS transitions. Layering a
//     transition on top of continuously-changing variables creates
//     visible lag; the 60Hz updates already feel continuous.
//
//   - List padding is sized to half the container height so the first
//     and last items can both reach the centerline. Recomputed on
//     resize via ResizeObserver.
//
//   - prefers-reduced-motion: gradient scaling is disabled; only the
//     currently-focused item gets a single, abrupt scale step + a
//     data-focused attribute hook for any additional CSS treatment.

import { useEffect, useLayoutEffect, useRef } from "react";

export type ScrollMagnifierProps = {
  items: string[];
  /** Scale applied at the focal centerline. Defaults to 2. */
  maxScale?: number;
  /** Scale applied at the far edges. Defaults to 0.75. */
  minScale?: number;
  /** Gaussian width (0–1). Smaller = sharper lens; larger = gentler falloff. Defaults to 0.65. */
  falloff?: number;
  className?: string;
  onFocusChange?: (index: number, text: string) => void;
};

export function ScrollMagnifier({
  items,
  maxScale = 2,
  minScale = 0.75,
  falloff = 0.65,
  className,
  onFocusChange,
}: ScrollMagnifierProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const lastFocusedRef = useRef<number>(-1);
  const onFocusChangeRef = useRef(onFocusChange);
  const itemsRef = useRef(items);

  // Keep the latest callbacks/items reachable from inside the effect
  // without retriggering subscription churn.
  useEffect(() => {
    onFocusChangeRef.current = onFocusChange;
    itemsRef.current = items;
  }, [onFocusChange, items]);

  // Pad the list so first/last items can reach centerline. Reads
  // container height, writes a CSS variable. Runs before paint.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const list = listRef.current;
    if (!container || !list) return;
    const padPx = container.clientHeight / 2;
    list.style.setProperty("--list-pad", `${padPx}px`);
  }, [items.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let rafId: number | null = null;

    function update(): void {
      rafId = null;
      const c = containerRef.current;
      if (!c) return;

      const cRect = c.getBoundingClientRect();
      const centerY = cRect.top + cRect.height / 2;
      const halfH = cRect.height / 2;
      const itemEls = c.querySelectorAll<HTMLLIElement>("[data-magnifier-item]");

      // Two-pass: first find the focused item, then write styles + the
      // data-focused attribute. Avoids a re-pass for "is this the one?"
      // inside the write loop.
      let bestIdx = -1;
      let bestDistance = Infinity;
      const focusAmounts: number[] = new Array(itemEls.length);

      for (let i = 0; i < itemEls.length; i++) {
        const el = itemEls[i];
        if (!el) continue;
        const iRect = el.getBoundingClientRect();
        const itemCenter = iRect.top + iRect.height / 2;
        const distance = Math.abs(itemCenter - centerY);

        // Distance-to-scale calculation:
        //
        //   normalized = clamp(0..1, distance / (container.height / 2))
        //
        //   focusAmount = exp( -(normalized / falloff)^2 )
        //
        // This is a Gaussian bell:
        //   - centerline       (normalized = 0)        → focusAmount = 1
        //   - one-falloff away (normalized = falloff)  → focusAmount ≈ 0.37 (= 1/e)
        //   - edge of viewport (normalized = 1)        → focusAmount ≈ 0 (with default falloff)
        //
        // A Gaussian feels more physical than linear because the
        // shoulder-to-tail transition is smooth on both sides.
        const normalized = Math.min(1, distance / halfH);
        const focusAmount = Math.exp(-Math.pow(normalized / falloff, 2));
        focusAmounts[i] = focusAmount;

        if (distance < bestDistance) {
          bestDistance = distance;
          bestIdx = i;
        }
      }

      for (let i = 0; i < itemEls.length; i++) {
        const el = itemEls[i];
        if (!el) continue;
        const isFocused = i === bestIdx;
        if (reduced) {
          // Strip continuous scaling; let CSS handle the focused-only state.
          el.style.removeProperty("--scale");
          el.style.removeProperty("--focus");
          if (isFocused) el.setAttribute("data-focused", "true");
          else el.removeAttribute("data-focused");
        } else {
          const focusAmount = focusAmounts[i] ?? 0;
          const scale = minScale + (maxScale - minScale) * focusAmount;
          el.style.setProperty("--scale", scale.toFixed(3));
          el.style.setProperty("--focus", focusAmount.toFixed(3));
          if (isFocused) el.setAttribute("data-focused", "true");
          else el.removeAttribute("data-focused");
        }
      }

      if (bestIdx !== lastFocusedRef.current) {
        lastFocusedRef.current = bestIdx;
        const cb = onFocusChangeRef.current;
        if (cb) cb(bestIdx, itemsRef.current[bestIdx] ?? "");
      }
    }

    function onScroll(): void {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(update);
    }

    // Initial paint (after layout-effect set the padding).
    update();

    container.addEventListener("scroll", onScroll, { passive: true });

    const resize = new ResizeObserver(() => {
      // Container height may have changed → repad the list, then recompute.
      const list = listRef.current;
      if (list && containerRef.current) {
        list.style.setProperty(
          "--list-pad",
          `${containerRef.current.clientHeight / 2}px`,
        );
      }
      onScroll();
    });
    resize.observe(container);

    return () => {
      container.removeEventListener("scroll", onScroll);
      resize.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [maxScale, minScale, falloff]);

  return (
    <div
      ref={containerRef}
      className={`scroll-magnifier${className ? ` ${className}` : ""}`}
      tabIndex={0}
      role="region"
      aria-label="Scroll magnifier list"
    >
      <ol ref={listRef} className="scroll-magnifier-list">
        {items.map((item, i) => (
          <li
            key={`${i}-${item}`}
            data-magnifier-item={i}
            className="scroll-magnifier-item"
          >
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}
