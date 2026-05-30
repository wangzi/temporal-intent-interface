"use client";

// THE one client island. Owns:
//   - scroll handler (rAF-throttled)
//   - nearest-entry detection vs the dot line at ~40vh
//   - .active class toggle on the matching <li data-entry-index="N">
//   - left-precision positioning of the fixed dot to the spine
//
// Step 5 — settle (.enriched) lands in Step 6; keyboard nav in Step 7.
// Mutates server-rendered DOM via querySelector; does not own React
// state for the entry list (kept lean per plan §3).
//
// Mount once per page (after the entry list and the dot).

import { useEffect } from "react";

const DOT_VH = 0.4; // matches `--dot-vh: 40` in globals.css

function positionDot(): void {
  const spine = document.querySelector<HTMLElement>(".spine");
  const dot = document.getElementById("dot");
  if (!spine || !dot) return;
  const rect = spine.getBoundingClientRect();
  // Center the dot on the spine's left edge. CSS sets top: 40vh; we
  // only override `left` so the dot aligns precisely with the spine
  // even after the layout reflows around fonts loading.
  dot.style.left = `${rect.left}px`;
}

function dotLineY(): number {
  return window.innerHeight * DOT_VH;
}

function nearestEntryIndex(entries: HTMLElement[]): number {
  const y = dotLineY();
  let bestIdx = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < entries.length; i++) {
    const el = entries[i];
    if (!el || el.style.display === "none") continue;
    const r = el.getBoundingClientRect();
    const center = r.top + r.height / 2;
    const distance = Math.abs(center - y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function setActive(entries: HTMLElement[], idx: number): void {
  for (let i = 0; i < entries.length; i++) {
    const el = entries[i];
    if (!el) continue;
    if (i === idx) el.classList.add("active");
    else el.classList.remove("active");
  }
}

export function ReaderControlsIsland(): null {
  useEffect(() => {
    const entries = Array.from(
      document.querySelectorAll<HTMLElement>("[data-entry-index]"),
    );

    if (entries.length === 0) {
      positionDot();
      return;
    }

    let ticking = false;
    let currentActive = -1;

    const onScroll = (): void => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const idx = nearestEntryIndex(entries);
        if (idx !== currentActive) {
          setActive(entries, idx);
          currentActive = idx;
        }
        ticking = false;
      });
    };

    const onResize = (): void => {
      positionDot();
      // Recompute active after resize; layout may have shifted.
      const idx = nearestEntryIndex(entries);
      setActive(entries, idx);
      currentActive = idx;
    };

    // Initial paint
    positionDot();
    const initialIdx = nearestEntryIndex(entries);
    setActive(entries, initialIdx);
    currentActive = initialIdx;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
