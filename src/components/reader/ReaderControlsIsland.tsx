"use client";

// THE one client island. Owns:
//   - scroll handler (rAF-throttled)
//   - nearest-entry detection vs the dot line at ~40vh
//   - .active class toggle on the matching <li data-entry-index="N">
//   - .collapsed class toggle on each entry's .enrich block
//   - 350ms settle timer → enrich the current active, dot.big
//   - left-precision positioning of the fixed dot to the spine
//   - keyboard navigation (↑↓jk PgUp/PgDn Home/End Enter Esc)
//
// Mutates server-rendered DOM via querySelector; does not own React
// state for the entry list (kept lean per plan §3).
//
// Hydration sequence:
//   useLayoutEffect → collapse every .enrich EXCEPT the active's.
//   Server paint shows all .enrich visible (JS-off contract); this
//   layout-effect runs before the next paint, so JS-on readers see
//   only the active enriched at first paint. On scroll, the active
//   also collapses; on settle (350ms still), the active re-enriches.
//
// Keyboard:
//   Archive route: arrows / j / k / Home / End scroll between entries;
//   Enter opens /post/{slug} via router.push(); Esc closes the nav rail
//   if open (step 8) else no-op.
//   Post route: Esc calls router.back() (no other keys bound — the
//   archive nav doesn't apply when there's only one article).

import { useEffect, useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const DOT_VH = 0.4; // matches `--dot-vh: 40` in globals.css
const SETTLE_MS = 350;

function positionDot(): void {
  const spine = document.querySelector<HTMLElement>(".spine");
  const dot = document.getElementById("dot");
  if (!spine || !dot) return;
  const rect = spine.getBoundingClientRect();
  dot.style.left = `${rect.left}px`;
}

function dotLineY(): number {
  return window.innerHeight * DOT_VH;
}

// True when the viewport is within `threshold`px of the document bottom.
// Near the foot of the page, animating .enrich heights changes the
// document height, which clamps scrollY, which re-fires `scroll` — a
// feedback loop that reads as jitter. We freeze scan-density there.
function nearBottom(threshold = 48): boolean {
  return (
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - threshold
  );
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

function collapseAll(entries: HTMLElement[]): void {
  for (const el of entries) {
    const enrich = el.querySelector<HTMLElement>(".enrich");
    enrich?.classList.add("collapsed");
  }
}

function enrichOnly(entries: HTMLElement[], idx: number): void {
  for (let i = 0; i < entries.length; i++) {
    const el = entries[i];
    if (!el) continue;
    const enrich = el.querySelector<HTMLElement>(".enrich");
    if (!enrich) continue;
    if (i === idx) enrich.classList.remove("collapsed");
    else enrich.classList.add("collapsed");
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

  // Layout-effect: synchronously initialise classes before paint.
  useLayoutEffect(() => {
    const entries = Array.from(
      document.querySelectorAll<HTMLElement>("[data-entry-index]"),
    );
    positionDot();
    if (entries.length === 0) return;
    const idx = nearestEntryIndex(entries);
    setActiveClass(entries, idx);
    enrichOnly(entries, idx);
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

    function scheduleSettle(): void {
      if (settleTimer !== null) {
        window.clearTimeout(settleTimer);
      }
      settleTimer = window.setTimeout(() => {
        if (currentActive >= 0) {
          enrichOnly(entries, currentActive);
        }
        setDotBig(true);
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
        }
        if (nearBottom()) {
          // Foot of the page: don't animate enrich heights (jitter). Keep
          // the active entry enriched and the dot settled.
          if (currentActive >= 0) enrichOnly(entries, currentActive);
          setDotBig(true);
        } else {
          setDotBig(false);
          if (entries.length > 0) collapseAll(entries);
          scheduleSettle();
        }
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
      scheduleSettle();
    }

    function moveTo(idx: number): void {
      if (entries.length === 0) return;
      const clamped = Math.max(0, Math.min(entries.length - 1, idx));
      if (clamped !== currentActive) {
        setActiveClass(entries, clamped);
        currentActive = clamped;
      }
      collapseAll(entries);
      setDotBig(false);
      scrollEntryToDot(entries, clamped);
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
    };
  }, [isPost, router]);

  return null;
}
