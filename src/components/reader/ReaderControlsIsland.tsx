"use client";

// THE one client island. Owns:
//   - scroll handler (rAF-throttled)
//   - nearest-entry detection vs the dot line at ~40vh
//   - .active class toggle on the matching <li data-entry-index="N">
//   - scan-density REVEAL: each entry's .enrich fades in as it nears the
//     focus line and out as it leaves — opacity only, no height change
//   - dot.big settle cue + left-precision dot positioning
//   - keyboard navigation (↑↓jk PgUp/PgDn Home/End Enter Esc)
//
// Mutates server-rendered DOM via querySelector; does not own React
// state for the entry list (kept lean per plan §3).
//
// Why opacity, not height: the reveal used to animate .enrich max-height,
// a LAYOUT property. Animating it during scroll reflows every frame and
// (with overflow-anchor:none) the collapse of off-screen entries shifts
// the content under the reader — the stutter near titles. Opacity is
// composited: it never triggers layout, so the scroll stays buttery and
// the reveal is a smooth, gradual fade tied to scroll position.
//
// Hydration: server paint shows all .enrich fully visible (JS-off
// contract). The layout-effect runs before the next paint and sets the
// by-distance opacities, so JS-on readers see the focused reveal at first
// paint with no flash.
//
// Keyboard:
//   Archive route: arrows / j / k / Home / End move between entries;
//   Enter opens /post/{slug}; Esc closes the nav rail (handled elsewhere).
//   Post route: Esc → router.back().

import { useEffect, useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const DOT_VH = 0.4; // matches `--dot-vh: 40` in globals.css
const SETTLE_MS = 350;
// Reveal ramp: an entry at the focus line is fully revealed (1); one this
// fraction of the viewport away from it sits at MIN_REVEAL. A generous
// range makes the fade gradual over scroll distance.
const REVEAL_VH = 0.16;
const MIN_REVEAL = 0.1;

function positionDot(): void {
  const spine = document.querySelector<HTMLElement>(".spine");
  if (!spine) return;
  const x = spine.getBoundingClientRect().left;
  const dot = document.getElementById("dot");
  if (dot) dot.style.left = `${x}px`;
  // The post route's back button rides the spine at the same X anchor — but
  // only on laptop+, where there's margin for it. On narrow widths the spine
  // hugs the text, so it falls back to its CSS top-left position.
  const back = document.querySelector<HTMLElement>(".attn-back");
  if (back) {
    if (window.innerWidth >= 768) back.style.left = `${x}px`;
    else back.style.removeProperty("left");
  }
  // The post route's "Ask AI" dot rides the same spine x (its vertical position
  // is CSS). Small enough to sit on the spine at every width.
  const askAi = document.querySelector<HTMLElement>(".ask-ai-dot");
  if (askAi) askAi.style.left = `${x}px`;
  // Expose the spine's viewport x so the Ask-AI panel can anchor its right edge
  // to the spine and extend into the empty left margin.
  document.documentElement.style.setProperty("--spine-vpx", `${x}px`);
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

function setActiveClass(entries: HTMLElement[], idx: number): void {
  for (let i = 0; i < entries.length; i++) {
    const el = entries[i];
    if (!el) continue;
    if (i === idx) {
      el.classList.add("active");
      el.setAttribute("aria-current", "location");
    } else {
      el.classList.remove("active");
      el.removeAttribute("aria-current");
    }
  }
}

// Set each entry's .enrich opacity from its distance to the focus line.
// Opacity-only → composited → no reflow → buttery. Continuous → gradual.
function revealByDistance(entries: HTMLElement[]): void {
  const line = dotLineY();
  const range = window.innerHeight * REVEAL_VH || 1;
  // The focused (nearest) entry is always fully revealed — a constant, sharp
  // pop independent of exact scroll position; everything else fades by
  // distance to the floor.
  const activeIdx = nearestEntryIndex(entries);
  for (let i = 0; i < entries.length; i++) {
    const el = entries[i];
    if (!el) continue;
    const enrich = el.querySelector<HTMLElement>(".enrich");
    if (!enrich) continue;
    if (i === activeIdx) {
      enrich.style.opacity = "1";
      continue;
    }
    const r = el.getBoundingClientRect();
    const center = r.top + r.height / 2;
    const t = 1 - Math.min(1, Math.abs(center - line) / range);
    enrich.style.opacity = (MIN_REVEAL + (1 - MIN_REVEAL) * t).toFixed(3);
  }
}

function setDotBig(big: boolean): void {
  const dot = document.getElementById("dot");
  if (!dot) return;
  if (big) dot.classList.add("big");
  else dot.classList.remove("big");
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function entryHrefAt(entries: HTMLElement[], idx: number): string | null {
  const el = entries[idx];
  if (!el) return null;
  const link = el.querySelector<HTMLAnchorElement>("h2 a[href]");
  return link?.getAttribute("href") ?? null;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollEntryToDot(entries: HTMLElement[], idx: number): void {
  const el = entries[idx];
  if (!el) return;
  const r = el.getBoundingClientRect();
  const target = window.scrollY + r.top + r.height / 2 - dotLineY();
  window.scrollTo({
    top: target,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

export function ReaderControlsIsland(): null {
  const pathname = usePathname();
  const router = useRouter();
  const isPost = pathname?.startsWith("/post/") ?? false;

  // Layout-effect: synchronously initialise classes + reveal before paint.
  useLayoutEffect(() => {
    const entries = Array.from(
      document.querySelectorAll<HTMLElement>("[data-entry-index]"),
    );
    positionDot();
    if (entries.length === 0) return;
    setActiveClass(entries, nearestEntryIndex(entries));
    revealByDistance(entries);
    setDotBig(true);
  }, []);

  // Effect: scroll / resize / keyboard.
  useEffect(() => {
    const entries = Array.from(
      document.querySelectorAll<HTMLElement>("[data-entry-index]"),
    );

    let ticking = false;
    let currentActive = entries.length ? nearestEntryIndex(entries) : -1;
    let settleTimer: number | null = null;

    // Settle only grows the dot back — the reveal itself is continuous, so
    // it needs no settle step (and never animates layout).
    function scheduleSettle(): void {
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        setDotBig(true);
        // Scroll has stopped — hide the spine labels (Back / Ask AI).
        document.documentElement.classList.remove("is-scrolling");
        settleTimer = null;
      }, SETTLE_MS);
    }

    function onScroll(): void {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (entries.length > 0) {
          const idx = nearestEntryIndex(entries);
          if (idx !== currentActive) {
            setActiveClass(entries, idx);
            currentActive = idx;
          }
          revealByDistance(entries);
        }
        setDotBig(false);
        // Reveal the spine labels (Back / Ask AI) while moving; settle hides them.
        document.documentElement.classList.add("is-scrolling");
        scheduleSettle();
        ticking = false;
      });
    }

    function onResize(): void {
      positionDot();
      if (entries.length === 0) return;
      const idx = nearestEntryIndex(entries);
      if (idx !== currentActive) {
        setActiveClass(entries, idx);
        currentActive = idx;
      }
      revealByDistance(entries);
    }

    function moveTo(idx: number): void {
      if (entries.length === 0) return;
      const clamped = Math.max(0, Math.min(entries.length - 1, idx));
      if (clamped !== currentActive) {
        setActiveClass(entries, clamped);
        currentActive = clamped;
      }
      setDotBig(false);
      scrollEntryToDot(entries, clamped); // smooth scroll → onScroll reveals
      scheduleSettle();
    }

    function onKeydown(e: KeyboardEvent): void {
      if (isEditableTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Post route: only Esc → router.back()
      if (isPost) {
        if (e.key === "Escape") {
          e.preventDefault();
          router.back();
        }
        return;
      }

      // Archive route
      switch (e.key) {
        case "ArrowDown":
        case "j":
        case "PageDown":
          e.preventDefault();
          moveTo(currentActive + 1);
          break;
        case "ArrowUp":
        case "k":
        case "PageUp":
          e.preventDefault();
          moveTo(currentActive - 1);
          break;
        case "Home":
          e.preventDefault();
          moveTo(0);
          break;
        case "End":
          e.preventDefault();
          moveTo(entries.length - 1);
          break;
        case "Enter": {
          const href = entryHrefAt(entries, currentActive);
          if (href) {
            e.preventDefault();
            router.push(href);
          }
          break;
        }
        case "Escape":
          // Step 8 hooks rail-close here; no-op until then.
          break;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeydown);
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      document.documentElement.classList.remove("is-scrolling");
    };
  }, [isPost, router]);

  return null;
}
