"use client";

// The single client island for the terminal hero. Returns null; mutates the
// server-rendered DOM imperatively (same shape as ReaderControlsIsland — the
// server stays source-of-truth for the data row).
//
// Choreography (motion allowed): a single glyph on the spine descends as it
// morphs, while the two rows type in beside it —
//   1. blinking | (cursor) at the clock row
//   2. morph | → >, type the clock row
//   3. descend to the data row, type it
//   4. morph > → ↓, descend to the CSS rest position, then bounce (scroll hint)
//
// The morph is an opacity cross-fade + textContent swap; the descent is a CSS
// `top` transition. Every position is HERO-RELATIVE (row offsetTop, or the CSS
// `top` rest) — never viewport-relative — so font reflow / scroll never throw
// the glyph off. Phase 4 reverts the inline `top` so the glyph settles to the
// stylesheet's `.hero-glyph { top }`.
//
// JS-off / reduced-motion: the SSR markup already shows the rested ↓ + the full
// data row; reduced motion just fills the clock and skips all animation. The
// clock row is the only client-only piece and its height is reserved → no CLS.

import { useEffect, useLayoutEffect } from "react";

const START_BLINK_MS = 600; // Phase 1: cursor blinks before it morphs
const TYPE_MS = 40; // per-character typing (spec)
const LINE_PAUSE_MS = 300; // pause at a row break (spec)
const MORPH_MS = 160; // opacity cross-fade half-cycle (matches CSS)
const DESCEND_MS = 420; // glyph `top` transition (matches CSS)

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Live local clock, e.g. "6:35 PM PDT | Tue Jun 2 2026". Client-only and
// intentionally non-deterministic (viewer timezone → real "PDT") — deliberately
// NOT in format.ts, which is the deterministic, SSR-safe (UTC) module.
function formatLocalClock(d: Date): string {
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(d);
  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
    .format(d)
    .replace(/,/g, ""); // "Tue, Jun 2, 2026" → "Tue Jun 2 2026"
  return `${time} | ${date}`;
}

// Hero-relative `top` that centres the glyph on a row. offsetTop is font-stable,
// so this is safe to read at any time.
function topForRow(row: HTMLElement, glyph: HTMLElement): number {
  return row.offsetTop + row.offsetHeight / 2 - glyph.offsetHeight / 2;
}

export function TerminalHeroIsland(): null {
  // Before first paint: jump the glyph to the clock row as a blinking |, and
  // clear the data row — so the morph starts from the top with no flash of the
  // SSR rested ↓.
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-hero-root]");
    if (!root) return;
    if (prefersReducedMotion()) return; // keep the SSR final state intact
    const glyph = root.querySelector<HTMLElement>("[data-hero-glyph]");
    const line1 = root.querySelector<HTMLElement>('[data-hero-line="clock"]');
    const dataEl = root.querySelector<HTMLElement>(".hero-term-data");
    if (glyph && line1) {
      glyph.style.transition = "none"; // jump without sliding from CSS rest
      glyph.style.top = `${topForRow(line1, glyph)}px`;
      glyph.textContent = "|";
      glyph.classList.add("is-blink");
      void glyph.offsetWidth; // flush, then re-enable the transition
      glyph.style.transition = "";
    }
    if (dataEl) dataEl.textContent = "";
    // Hide the › prompts until the cursor types each row (they fade in below).
    // Reduced-motion returned above, so the SSR-visible prompts stay.
    root
      .querySelectorAll<HTMLElement>("[data-hero-prompt]")
      .forEach((p) => (p.style.opacity = "0"));
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-hero-root]");
    if (!root) return;
    const glyph = root.querySelector<HTMLElement>("[data-hero-glyph]");
    const clockEl = root.querySelector<HTMLElement>("[data-hero-clock]");
    const dataEl = root.querySelector<HTMLElement>(".hero-term-data");
    const line2 = root.querySelector<HTMLElement>('[data-hero-line="data"]');
    const clockPrompt = root.querySelector<HTMLElement>(
      '[data-hero-prompt="clock"]',
    );
    const dataPrompt = root.querySelector<HTMLElement>(
      '[data-hero-prompt="data"]',
    );
    const clockStr = formatLocalClock(new Date());

    if (prefersReducedMotion()) {
      if (clockEl) clockEl.textContent = clockStr; // data row + ↓ already final
      return;
    }
    if (!glyph || !clockEl || !dataEl || !line2) return;

    const finalData = dataEl.dataset.heroFinal ?? "";
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, ms));

    let t = START_BLINK_MS;

    // Phase 2: end the blink, morph | → > (cross-fade).
    at(t, () => glyph.classList.remove("is-blink"));
    at(t, () => {
      glyph.style.opacity = "0";
    });
    at(t + MORPH_MS, () => {
      glyph.textContent = ">";
      glyph.style.opacity = "1";
    });
    t += MORPH_MS * 2;

    // Type the clock row (glyph stays at the clock row).
    for (let i = 1; i <= clockStr.length; i++) {
      t += TYPE_MS;
      const n = i;
      at(t, () => {
        clockEl.textContent = clockStr.slice(0, n);
      });
    }

    // Phase 3: the clock row is typed — leave its › prompt on the spine, then
    // descend to the data row.
    t += LINE_PAUSE_MS;
    at(t, () => {
      if (clockPrompt) clockPrompt.style.opacity = "1";
      glyph.style.top = `${topForRow(line2, glyph)}px`;
    });
    t += DESCEND_MS;

    // Type the data row.
    for (let i = 1; i <= finalData.length; i++) {
      t += TYPE_MS;
      const n = i;
      at(t, () => {
        dataEl.textContent = finalData.slice(0, n);
      });
    }

    // Phase 4: the data row is typed — leave its › prompt, morph > → ↓ and
    // descend to the CSS rest (clear the inline top).
    t += LINE_PAUSE_MS;
    at(t, () => {
      if (dataPrompt) dataPrompt.style.opacity = "1";
      glyph.style.opacity = "0";
    });
    at(t + MORPH_MS, () => {
      glyph.textContent = "↓";
      glyph.style.opacity = "1";
      glyph.style.top = ""; // → stylesheet `.hero-glyph { top }`, transitions there
    });
    t += Math.max(MORPH_MS * 2, DESCEND_MS);

    // Settle: bounce as the resting scroll hint.
    at(t, () => glyph.classList.add("is-bounce"));

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, []);

  return null;
}
