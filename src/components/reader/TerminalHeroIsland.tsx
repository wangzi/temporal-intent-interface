"use client";

// The single client island for the terminal hero. Returns null; mutates the
// server-rendered DOM imperatively (same shape as ReaderControlsIsland — no
// React state for the hero's content; the server stays source-of-truth).
//
// Sequence (motion allowed): blink a caret on line 1 → type `> `+clock → 300ms
// line-break pause → caret to line 2 → type the data string → reveal the
// bouncing arrow. The arrow + data line already exist in SSR (JS-off contract);
// the island hides them BEFORE first paint (useLayoutEffect, no flash) and
// restores them at the end.
//
// Reduced motion: skip all typing; just fill the live clock. The data line and
// arrow stay in their SSR final state (the bounce is killed by the CSS
// prefers-reduced-motion rule).
//
// CLS-safe: every row's height is reserved in CSS, so clearing/typing text and
// the clock's late arrival never reflow the page.

import { useEffect, useLayoutEffect } from "react";

const TYPE_MS = 40; // per-character typing speed (spec)
const LINE_PAUSE_MS = 300; // pause at a line break (spec)
const START_BLINK_MS = 600; // Phase 1: caret blinks briefly before typing

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

export function TerminalHeroIsland(): null {
  // Before first paint: hide the final arrow + clear the data line so typing
  // starts from empty with no flash of the SSR final state.
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-hero-root]");
    if (!root) return;
    if (prefersReducedMotion()) return; // keep the SSR final state intact
    root.classList.add("is-animating");
    const dataEl = root.querySelector<HTMLElement>(".hero-term-data");
    if (dataEl) dataEl.textContent = "";
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-hero-root]");
    if (!root) return;
    const clockEl = root.querySelector<HTMLElement>("[data-hero-clock]");
    const dataEl = root.querySelector<HTMLElement>(".hero-term-data");
    const line1 = clockEl?.closest<HTMLElement>(".hero-term-line") ?? null;
    const line2 = dataEl?.closest<HTMLElement>(".hero-term-line") ?? null;
    const finalData = dataEl?.dataset.heroFinal ?? "";
    const clockStr = formatLocalClock(new Date());

    if (prefersReducedMotion()) {
      if (clockEl) clockEl.textContent = clockStr; // fill clock, no animation
      return; // data line + arrow already final from SSR
    }

    const timers: number[] = [];
    let t = START_BLINK_MS;

    // Phase 1: caret blinks on line 1 (CSS `.is-typing::after`).
    line1?.classList.add("is-typing");

    // Phase 2: type the clock after the static `> ` prompt.
    for (let i = 1; i <= clockStr.length; i++) {
      t += TYPE_MS;
      const n = i;
      timers.push(
        window.setTimeout(() => {
          if (clockEl) clockEl.textContent = clockStr.slice(0, n);
        }, t),
      );
    }

    // Phase 3: line-break pause, then move the caret to line 2.
    t += LINE_PAUSE_MS;
    timers.push(
      window.setTimeout(() => {
        line1?.classList.remove("is-typing");
        line2?.classList.add("is-typing");
      }, t),
    );

    // Phase 4: type the data string.
    for (let i = 1; i <= finalData.length; i++) {
      t += TYPE_MS;
      const n = i;
      timers.push(
        window.setTimeout(() => {
          if (dataEl) dataEl.textContent = finalData.slice(0, n);
        }, t),
      );
    }

    // Phase 5: stop typing; reveal the bouncing arrow (drops .is-animating).
    t += LINE_PAUSE_MS;
    timers.push(
      window.setTimeout(() => {
        line2?.classList.remove("is-typing");
        root.classList.remove("is-animating");
      }, t),
    );

    return () => {
      for (const id of timers) window.clearTimeout(id);
      line1?.classList.remove("is-typing");
      line2?.classList.remove("is-typing");
      root.classList.remove("is-animating");
    };
  }, []);

  return null;
}
