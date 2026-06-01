# Production wiring plan — the Go-review footer

**Branch:** `feat/footer-review` (off `main` @ 04cbee1)
**Goal:** promote the lab's footer-review (Go stones → slide-up sheet → live move toggles) from `/lab/footer` into the **real reader footer** on `/` and `/post/[slug]`, without breaking SSR / JS-off.
**Status:** ✅ BUILT on this branch (commit `62c5624`), preview-verified, **not merged to main** (awaits explicit authorization).

**Resolved decisions (§6):** (1) default opening = **Closing column** · (2) state scope = **per-page reset** (A1) · (3) post-route footer = **full** (adds `listPosts()`) · (4) moves = **footer-only** in v1 · (5) live-visibility = **mini live-preview in the sheet** · (6) board = client-only, sole entry. All three openings stay selectable from the board — keeping all three (the reader chooses the footer's voice) rather than picking one winner.

**Implementation note:** components stayed in their `components/lab/footer/` + `lib/lab/` paths for this pass (imported by the new `components/reader/FooterReview.tsx`); the namespace move out of `lab/` is a deferred cleanup. The old `Footer.tsx` is superseded but left in place (unimported).

---

## 1. The crux

The reader is **SSR / server components** and must **render + read with JS disabled** (Hard Rule §17.4). The board reconfigures the footer **live on the client**, **session-only**. So the footer has to do two things at once:

- **SSR a real, default footer** (a chosen opening + default moves) so JS-off readers get a complete footer.
- **Hydrate into the board-controlled interactive version** when JS loads — same progressive-enhancement shape the reader already uses for scan-density and the dot.

Nothing persists; state is in-memory for the session.

---

## 2. Component moves (lab → production)

The lab components are sound; promote them out of the `lab/` namespace:

| From (lab) | To (production) |
|---|---|
| `components/lab/footer/FooterColumn|Index|Spine.tsx` | `components/reader/footer/` |
| `components/lab/footer/ArchiveAsk.tsx` | `components/reader/footer/` |
| `components/lab/footer/GoBoard.tsx`, `ReviewSheet.tsx` | `components/reader/footer/` |
| `components/lab/footer/BoardLab.tsx` | → rename **`FooterReview.tsx`** (the production island) |
| `lib/lab/footer-data.ts`, `lib/lab/archive-search.ts` | `lib/footer/` |
| `globals.css` `.lf-* / .go-* / .sheet-* / .move-*` | keep (already in globals) |

`/lab/footer` stays as the tuning surface (can keep importing from the new paths or stay frozen).

---

## 3. The state seam (the one real decision)

`FooterReview` is a **client island** that owns the moves state and renders: the active variant (the real footer, at page bottom) + `GoBoard` + `ReviewSheet` + the fly stone. It SSRs its initial state, so JS-off readers get the default footer.

Two scopes — pick one:

- **A1 · Per-page state (recommended v1).** `FooterReview` holds `useState`; mounted in each page. Simple, ships now. Moves reset when you navigate archive↔post (a "session" is loosely the current view). No root-layout surgery.
- **A2 · Session-wide via root context.** A client `ReviewProvider` in `app/layout.tsx` (wrapping SSR children by composition) holds the moves; footer + board consume it. Moves persist across in-session navigation. More architecture; correct if "session-only" must survive route changes.

Both are session-only (in-memory, no storage). Recommend **A1** now, **A2** as a follow-up if moves-should-stick-across-posts matters.

---

## 4. Route specifics

- **`/` (archive):** already fetches the post list → pass `posts` to `<FooterReview posts={...} />`, replacing `<Footer/>`.
- **`/post/[slug]`:** today fetches only the single post. The footer's threads/ask need the **corpus**, so either:
  - **(i)** add a `listPosts()` call on the post route (ISR-cached; small cost), or
  - **(ii)** ship a **lite** footer on post pages (studio + colophon only — no corpus-dependent moves).
  Decision in §6.
- **Board is client-only** (rendered after mount) so JS-off readers don't see a dead button; they get the default footer, no board.

---

## 5. Hard-rule checks

| Rule | How it's kept |
|---|---|
| §17.4 SSR + JS-off | `FooterReview` SSRs the default opening + default moves → complete footer without JS. Board is client-only. |
| AI summoned, never ambient | The ask stays summoned (reader types). No change. |
| One red accent | Stones are black/white; red appears only as the framed-move ring + the existing attention dot. |
| No state library | `useState` / Context only. |
| No durable state | In-memory session only; no storage, no URL params. |
| Reduced motion | Sheet opens instantly; no stone flight (already handled). |

---

## 6. Decisions needed before building

1. **Default opening** — which layout (Closing column / Index / Spine) is the SSR default = the JS-off footer = the initial position? *(Depends on the layout winner — still being chosen.)*
2. **State scope** — A1 per-page (reset on nav) or A2 session-wide (root context)?
3. **Post-route footer** — full (add `listPosts()`) or lite (studio + colophon)?
4. **Scope of "moves"** — footer-only in v1, or set up to extend to reader-wide toggles (scan-density, lens) later?
5. **Live visibility** — the sheet covers the bottom 42vh where the footer sits, so toggling footer moves isn't visible until you close. Accept that, or add a small live-preview strip of the active footer at the top of the sheet?
6. **Mobile** — board size/position at ≤700px; confirm the board is the sole entry (no menu fallback needed).

---

## 7. Build sequence (once §6 is settled)

1. Move components/lib out of `lab/` → production paths; update imports.
2. Build `FooterReview` (from `BoardLab`): render the active variant as the real footer + board + sheet; SSR the default.
3. Swap `<Footer/>` → `<FooterReview posts={...}/>` on `/` (and `/post/[slug]` per §6.3).
4. (If A2) add `ReviewProvider` to `app/layout.tsx`.
5. Verify: JS-off renders the default footer on both routes; reduced-motion; mobile; keyboard (board focusable, sheet Esc/focus); `pnpm typecheck && lint && build`.
6. Preview deploy → review → merge to `main` with explicit authorization.

---

## 8. Risk / watch

- **The "live but hidden" tension (§6.5)** is the main UX risk — the footer changes under the open sheet. Lab hides this by using a visible stage; production can't (the footer is genuinely at the bottom). Mini-preview strip is the likely answer.
- **Post-route extra fetch** if we go full footer there.
- **Board ↔ existing fixed UI** (the reader's red dot at 40vh, the auto-hide rail/top-years triggers) — confirm no z-index / hit-area collisions at the corners.
- Keep `/lab/footer` working as the tuning surface during/after the promotion.
