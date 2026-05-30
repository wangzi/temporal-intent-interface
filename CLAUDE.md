# CLAUDE.md — tii (Temporal Intent Interface)

> **Audience:** Claude Code agents + human engineers (UXD + SWE) joining the project.
> Read this before touching code.
> **Last verified:** 2026-05-30.

---

## 1. Product

The public reader at **`https://z.stillinlove.co`**. A temporal-first reader that treats reading as an **active, AI-native operation** rather than a feed of posts. The interface is built around three primitives:

- **Vertical = time.** Newest at top; scrolling down travels backward through memory.
- **Fixed dot ≈ attention.** A red circle anchored at ~40vh; content scrolls through it; the nearest entry becomes active.
- **Two visible layers.** Layer 1 (Title + Intent) for scanning and orienting; Layer 2 (Attention) for full canonical reading.

**External name:** "z.". **Internal codename:** TII (Temporal Intent Interface). Refer to the surface as "z." in user-facing text; "TII" in engineering work.

This repo is **the head only**. The data and writing live in the journalkit engine. TII renders engine data; it holds **no durable content or intent state**.

Source of truth: `~/Desktop/session2_tii/canonical_prd.md` (PRD v1, 2026-05-30). Where this `CLAUDE.md` and the PRD disagree about product scope or interaction, the PRD wins. Where they disagree about existing code behavior, this file wins for code safety.

---

## 2. Architecture

```
            anonymous browser
            │
            ▼
    ┌────────────────────┐         server-to-server          ┌─────────────────────────┐
    │ TII (Next.js 15)   │   GET /api/v1/posts*              │  journalkit engine       │
    │ SSR + 1 client     │◀─────────────────────────────────▶│  studio.stillinlove.co   │
    │ island             │   Bearer JOURNALKIT_API_KEY        │  (separate repo)         │
    │ z.stillinlove.co   │   server-only via                  │                          │
    └────────────────────┘   src/lib/engine/client.ts         └─────────────────────────┘
                             (zod-guarded responses)
```

- **SSR pages** call `engine.listPosts()` / `engine.getPost(slug)` directly via `src/lib/engine/client.ts`. No client round-trip on the read path.
- **Route handlers** at `src/app/api/v1/posts*` re-export the same engine module as JSON for future client uses (Phase C: selection / synthesis). Phase B page routes do **not** call them.
- **`JOURNALKIT_API_KEY` is server-only.** `import "server-only"` is at the top of `src/lib/engine/client.ts`; the bundler fails build if a client component ever imports it.
- **Fixture mode** (`JOURNALKIT_FIXTURE_MODE=true`) routes engine calls to local JSON in `src/lib/engine/fixtures/` so the reader can be built while the engine API is still in flight.

---

## 3. Repo & branches

| | |
|---|---|
| GitHub | `https://github.com/wangzi/z` (existing repo, reused per owner override of PRD §19 default `wangzi/tii`) |
| Local working tree | `/Users/zw/Desktop/tii/` |
| Visibility | Private |
| Default branch | `main` (production — auto-deploys to Vercel project `halftimes-projects/z-stillinlove-co` on push) |
| Current work | `feat/phase-b-scaffold` (13 serial commits; one preview URL per commit) |
| Archival | `design/editions`, `design/dispatch`, `design/log`, `docs/claude-md` — 2026-05-27 design exploration; **do not delete** |
| Commit trailer | `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` |
| Pushing to `main` | Requires explicit per-push user authorization ("ship it" / "yes, push to main") per PRD §17.12 |

---

## 4. Tech stack (exact versions, pinned)

### Runtime / toolchain
| | |
|---|---|
| Node.js | `>= 20` (Vercel default) |
| Package manager | `pnpm@10.33.2` (pinned via `packageManager` field) |
| Bundler | Next.js built-in (Turbopack-eligible; Webpack today) |

### Frameworks
| Package | Version | Role |
|---|---|---|
| `next` | `^15.1.0` | App Router, server components, route handlers, middleware |
| `react` / `react-dom` | `^19.0.0` | UI runtime |
| `typescript` | `^5.7.0` | Strict + `noUncheckedIndexedAccess` |

### Styling
| Package | Version | Role |
|---|---|---|
| `tailwindcss` | `^4.0.0` | CSS-first config via `@theme inline` in `src/app/globals.css` |
| `@tailwindcss/postcss` | `^4.0.0` | PostCSS plugin |
| `postcss` | `^8.5.0` | |
| `clsx` | `^2.1.1` | Conditional class joining |
| `tailwind-merge` | `^2.6.0` | Deduplicates conflicting Tailwind classes |

### Engine boundary
| Package | Version | Role |
|---|---|---|
| `zod` | `^3.24.1` | Env validation + engine response guard at the BFF boundary |
| `server-only` | `^0.0.1` | Marks `src/lib/engine/client.ts`; build fails if a client component imports it |

### Fonts
| Family | Loaded via | Role |
|---|---|---|
| Newsreader | `next/font/google` (opsz 6..72, 400/500/600 + italic 400) | Canonical author serif |
| JetBrains Mono | `next/font/google` (400/500) | System / metadata / generated text |

### Lint
| Package | Version | Role |
|---|---|---|
| `eslint` | `^8.57.0` | |
| `eslint-config-next` | `^15.1.0` | Next's recommended ruleset |

**Deliberate omissions (Hard Rule §17.11):** no state library (Zustand/Redux/Jotai), no data-fetching library (TanStack Query/SWR), no form library, no test library. Playwright lands in Phase C per PRD §18.

---

## 5. Codebase structure

```
/Users/zw/Desktop/tii/
├── CLAUDE.md                  ← this file
├── README.md                  quickstart
├── LICENSE                    MIT
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json              strict + noUncheckedIndexedAccess; @/* → ./src/*
├── tailwind.config.ts         minimal v4 stub (CSS-first lives in globals.css)
├── postcss.config.mjs         @tailwindcss/postcss
├── next.config.mjs
├── vercel.json                { "framework": "nextjs" }
├── .env.example
├── .gitignore
├── public/
└── src/
    ├── app/
    │   ├── globals.css        §13 design tokens via @theme inline + ported prototype CSS
    │   ├── layout.tsx         Root layout; next/font Newsreader + JetBrains Mono
    │   ├── page.tsx           / — archive index (SSR, revalidate=60)
    │   ├── not-found.tsx
    │   ├── post/[slug]/
    │   │   └── page.tsx       Attention — single post (SSR, revalidate=300)
    │   └── api/v1/
    │       ├── posts/route.ts         BFF passthrough (Phase C)
    │       └── posts/[slug]/route.ts  BFF passthrough (Phase C)
    ├── components/reader/
    │   ├── TemporalLayout.tsx
    │   ├── Spine.tsx
    │   ├── Dot.tsx
    │   ├── TopBar.tsx
    │   ├── NavigationRail.tsx
    │   ├── TimeIndex.tsx
    │   ├── TitleIntentLayer.tsx
    │   ├── ScanDensity.tsx
    │   ├── AttentionView.tsx
    │   ├── CanonicalBody.tsx
    │   ├── SelectionLayer.tsx
    │   ├── CopyPrompt.tsx
    │   ├── ReaderControlsIsland.tsx   THE one client island
    │   └── Footer.tsx
    └── lib/
        ├── env.ts             zod-validated env (fail-loud at boot)
        ├── format.ts          deterministic date / "ago" / reading-time helpers
        └── engine/
            ├── client.ts      "server-only"; listPosts, getPost
            ├── types.ts       §9 contract types
            ├── schemas.ts     zod response guards
            ├── fixtures.ts    fixture loader (env-toggled)
            └── fixtures/
                ├── posts.json
                └── post-*.json
```

---

## 6. Reader information architecture

### Two visible layers

```txt
Layer 1: Title + Intent     scan / orient / decide
Layer 2: Attention          read / act / branch
```

### Primitives

- **Temporal spine** — vertical 1px line on the left, time-coded. Newest entries are higher; scrolling down travels backward.
- **Fixed dot** — red circle anchored at `top: 40vh, left: var(--spine-x)`. Content scrolls through it. The nearest entry becomes active.
- **Scan density** — idle (date · reading time · title · Intent Label) → settled (+ Intent Statement + Key Insight). 350ms settle on scroll stillness.
- **Attention** — full canonical reading at `/post/[slug]`. Persistent spine, dot tracks active paragraph.
- **Copy Prompt** — selection-triggered, **client-side**, builds a structured prompt from title + intent + passage. Never fails (no network).
- **Local Constellation** (Phase C) — sparse explainable branches; no `reason` → no branch.

### Hard product rules at the reader level (PRD §17.21–35)

These bind reader code. Violating one breaks product integrity.

```txt
21. One red accent.
22. Serif = author.
23. Mono = system.
24. Provenance lives in the DOM (data-text-origin, data-generated-by).
25. Vertical is the navigation axis.
26. Horizontal space is layout, never a second scroll axis.
27. Reading measure is capped at 66ch.
28. AI is summoned from focus.
29. Copy Prompt is client-side and never fails.
30. Intent is authored.
31. AI may suggest intent only with an evidence drawer.
32. Branches follow the Mountain View visibility rule.
33. AI never rewrites canonical text.
34. Insight is density, not a third layer.
35. No reason → no branch.
```

---

## 7. Design system (summary; full tokens in `globals.css`)

### Color (light → dark via `@media (prefers-color-scheme: dark)`)

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-field` | `#fcfcfa` | `#0e0e0e` | reading background |
| `--color-ink` | `#1a1a1a` | `#eceae4` | canonical serif body |
| `--color-ink-soft` | `#3a3a3a` | `#c4c0b6` | secondary serif (snippet) |
| `--color-system` | `#6b6b6b` | `#9a9a92` | mono / metadata / generated |
| `--color-system-faint` | `#9a9a95` | `#6b6b63` | labels, timestamps, faint mono |
| `--color-dot` | `#e5484d` | `#ff5a5f` | the single red accent |
| `--color-branch` | `#c9c9c4` | `#3a3a36` | spine + relation lines |
| `--color-focus` | `#2b6cb0` | `#2b6cb0` | `:focus-visible` ring |
| `--color-rule` | `#ececE8` | `#222220` | hairline dividers |

**Contrast:** dot ≥3:1 against `--field` (non-text graphic, WCAG 1.4.11); mono text ≥4.5:1; color is never the sole signal.

### Type

```txt
--t-meta         0.75rem                                       (fixed)
--t-label        0.8125rem                                     intent label
--t-body         clamp(1.0625rem, 1rem + 0.4vw, 1.1875rem)     ~17 → 19px
--t-insight      0.9375rem                                     statement / key insight
--t-title-scan   clamp(1.35rem, 1.08rem + 1.05vw, 1.62rem)     entry title (idle)
--t-title-read   clamp(1.7rem, 1.25rem + 1.5vw, 2.15rem)       entry title (Attention)
--measure        66ch                                          line-length cap
```

Measure rule: line length caps ~66 characters. Large screens get **margin, rail, time-index** — never longer lines.

### Breakpoints

```txt
≤700px      portrait     spine-x 28 · content-pad 56 · base type · hamburger
701–1079px  tablet       spine-x 40 · content-pad 68 · inline top nav
≥1080px     laptop       --rail-w 248 · persistent left rail · measure holds · type steps up
≥1500px     wide         --rail-w 280 · --index-w 120 · right time-index appears
```

### Motion

`--ease: cubic-bezier(0.2, 0, 0, 1)`. Density reveal 0.32s; dot resize 0.2s; reduced-motion disables all transitions and smooth-scroll. Motion communicates state only — no parallax, no decorative animation.

---

## 8. Interaction grammar (PRD §14)

```txt
wheel / trackpad / touch scroll:  move through time
nearest entry to dot:             becomes active
↓ / j / PageDown:                 next older entry
↑ / k / PageUp:                   newer entry
Home / End:                       latest / oldest loaded
Enter:                            open Attention  (route to /post/{slug})
Escape:                           close rail / router.back() from Attention
title click/tap:                  open Attention
Intent Label click/tap:           open Local Constellation (Phase C)
red dot click/tap:                action menu (Phase C)
text selection on /post/[slug]:   open Thinking Mode (Phase C; Copy Prompt available in B)
```

Dwell may **reveal** (scan density enrich). Dwell never **commits**. Click / tap / Enter commits.

### Attention is a route, not an overlay

Title `<a href="/post/{slug}">` works JS-off. JS-on: `Enter` calls `router.push(...)`; `Escape` on `/post/[slug]` calls `router.back()`. **No focus trap, no `role="dialog"` modal.** This is the project's deliberate divergence from the prototype HTML, which was single-file and used an overlay; the SSR + JS-off contract (§17.4 / PRD §15) requires routes.

---

## 9. Accessibility & provenance (PRD §15)

### Semantic structure

```html
<main aria-label="Journal — temporal archive">
  <ol aria-label="Entries in reverse chronological order">
    <li data-entry-index="0" data-year="2026" data-label="…">
      <article aria-labelledby="entry-title-…">
        <header>
          <time datetime="2026-04-27T00:00:00Z">April 27, 2026</time>
          <h2 id="entry-title-…">
            <a href="/post/…">Title</a>
          </h2>
          <button aria-label="Open intent graph: …">Intent Label</button>
        </header>
        <p data-text-origin="canonical">Snippet</p>
      </article>
    </li>
  </ol>
</main>
```

### Provenance attributes (every text node)

```txt
data-text-origin="canonical"    author prose (default for <CanonicalBody>)
data-text-origin="generated"    AI marginalia (Phase C)
data-generated-by="ai"          on AI elements (Phase C)
data-source-checksum="..."      provenance anchors (Phase C)
data-provenance-id="..."        provenance anchors (Phase C)
```

### Focus, keyboard, live regions

- `:focus-visible` ring always visible (`--color-focus`).
- One roving tabindex across entry marks; arrows move it; Tab exits the timeline.
- Mobile menu via `<details>` (native disclosure works JS-off).
- Live regions: `role="status" aria-live="polite"` for user-requested generation results; never for passive AI.
- Touch targets: 44×44 mobile, 24×24 desktop minimum.

---

## 10. Engine API contract (PRD §9, consumed)

Base: `https://studio.stillinlove.co/api/v1` (server-side only).

### Reads (Phase B)

```txt
GET /api/v1/posts?sort=newest|oldest&cursor=
  → { posts: PostSummary[], next_cursor?: string }

GET /api/v1/posts/{slug}
  → { post: PostDetail }   // body_html is sanitized by the engine

GET /api/v1/intents/{post_id}/edges     (Phase C)
GET /api/v1/site/now                     (Phase C)
GET /api/v1/site/pinned                  (Phase C)
```

**Canonical ruling (PRD §9 D16):** the engine returns **sanitized HTML** for post bodies. TII does **not** re-sanitize. `<CanonicalBody html={post.body_html} />` uses `dangerouslySetInnerHTML`; the engine sanitization is the trust boundary.

### Summoned generation (Phase C, server-to-server)

```txt
POST /api/v1/synthesize/thought-card
  body: { slug, selection, op_type, op_flavor? }
```

### Boundary rules

```txt
TII browser never sees JOURNALKIT_API_KEY
TII BFF holds the server-side key
GET endpoints do not start expensive generation
the reader path never blocks on generation
```

---

## 11. Code conventions

- **TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true`, `moduleResolution: "bundler"`, `target: ES2022`. Path alias `@/*` → `./src/*`.
- **Server-first:** server components by default. Only mark `"use client"` on islands that need browser APIs / interactivity:
  - `ReaderControlsIsland` (scroll, keyboard, dot, settle, rail toggle)
  - `SelectionLayer`, `CopyPrompt` (mounted on `/post/[slug]` only)
  - `TimeIndex` click handler (small)
- **Server-only modules:** `src/lib/engine/client.ts` starts with `import "server-only"`. Build-time barrier. Never relax.
- **No API key in client code.** Ever.
- **Provenance is in the DOM.** Every text-rendering component sets `data-text-origin="canonical|generated"`.
- **Errors from BFF:** thrown to `notFound()` on 404; otherwise bubble. Phase B keeps it simple; Phase C may add an error envelope.
- **No `dangerouslySetInnerHTML` outside `<CanonicalBody>`.** That component is the single trust seam.
- **Reader pages must render with JS disabled.** Test before merging anything that touches the read path.
- **One client island.** `ReaderControlsIsland` owns all scroll + keyboard + dot state. Don't fragment it into multiple islands without an explicit reason.

---

## 12. Progressive-enhancement contract

| Reader | What they see |
|---|---|
| **JS off** | Full reverse-chronological `<ol>` with semantic markup; **all `.enrich` blocks visible** (denser, not broken); titles are real links; post pages fully readable; static dot at `top: 40vh`; mobile menu via `<details>`; URL filters work via SSR |
| **JS on** | Same content, plus: `ReaderControlsIsland` mounts → `useLayoutEffect` measures each `.enrich` height → adds `.collapsed` class to all but the first → scroll/keyboard/settle take over → dot left-aligns precisely to the spine bbox |

**No flash, no shift.** Server HTML = full content. Hydration mutation is post-paint with measured heights.

---

## 13. Env vars

All validated at boot via `src/lib/env.ts` (zod). Missing/malformed → fail loud at import. There's one carve-out: during `NEXT_PHASE === "phase-production-build"`, env validation accepts placeholder values so `next build` works without real secrets in CI.

| Var | Scope | Used for |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Vercel + `.env.local` | Absolute URLs (OG, canonical). No trailing slash. Local: `http://localhost:3000`. Prod: `https://z.stillinlove.co`. |
| `JOURNALKIT_API_URL` | Server-only | journalkit engine base, e.g. `https://studio.stillinlove.co/api/v1` |
| `JOURNALKIT_API_KEY` | Server-only | Bearer token to the engine. **Never** prefix with `NEXT_PUBLIC_`. |
| `JOURNALKIT_FIXTURE_MODE` | Server-only | When `true`, engine client reads from local fixture JSON. Phase B default. |

---

## 14. Local dev

```bash
cd /Users/zw/Desktop/tii
pnpm install
cp .env.example .env.local
# Phase B: JOURNALKIT_FIXTURE_MODE=true is the default.

pnpm dev          # http://localhost:3000
pnpm typecheck    # tsc --noEmit (strict + noUncheckedIndexedAccess)
pnpm lint         # next lint
pnpm build        # next build (production verification)
```

When the engine API goes live, set `JOURNALKIT_API_URL` + `JOURNALKIT_API_KEY` and flip `JOURNALKIT_FIXTURE_MODE=false`.

---

## 15. Build & deploy

| | |
|---|---|
| Host | Vercel (project `halftimes-projects/z-stillinlove-co`) |
| Trigger | Push to any branch → auto-preview; merge to `main` → auto-deploy to `z.stillinlove.co` |
| Build command | `next build` (= `pnpm build`) |
| Output | Next.js default |
| Node | 20 (Vercel default) |
| Preview deployments | Public — SSO/Deployment Protection is currently disabled to enable design review |

### Phase B branch flow

Single long-lived `feat/phase-b-scaffold` cut from `main`. 13 serial commits, one preview URL each, per the plan at `~/.claude/plans/users-zw-desktop-session2-tii-canonical-atomic-brook.md`. Merge to `main` only with explicit owner authorization (PRD §17.12).

---

## 16. Adjacent projects (read-only context)

- **journalkit** — `~/Desktop/journalkit/`, `https://github.com/wangzi/journalkit`. The engine. Deployed at `studio.stillinlove.co`. **Do not import journalkit code at runtime;** copy patterns only where useful (env validation, server-only client). Reference for `tsconfig.json`, `.gitignore`.
- **PRD source** — `~/Desktop/session2_tii/canonical_prd.md`. Canonical V1 source of truth. Read PRD §8, §9, §13, §14, §15, §17, §18 in detail before changing reader behavior.
- **Prototype** — `~/Desktop/session2_tii/journalkit_responsive_reader.html`. The visual reference TII ports from. Read once end-to-end.
- **Halftime** — `~/halftime/`. Multi-tenant social feed; journalkit's pattern source. Out of scope for TII; read-only.
- **Atomic** — `~/Desktop/Atomic/`. iOS voice-capture app. Has its own `CLAUDE.md`. The "Ghost Core" intent-lifecycle there is **different** from TII — do not conflate the names. TII is a journal reader; Ghost Core is an intent-lifecycle system inside an iOS app.

---

## 17. Hard rules (non-negotiable for TII)

Inherited reader-binding rules from PRD §17 plus TII-specific additions.

```txt
1.  Public reader paths (/, /post/[slug]) SSR and must render with JS disabled.
2.  Author / studio routes do NOT exist in this repo. Authoring lives at studio.stillinlove.co.
3.  Server actions must call requireAuthor() — except TII has none in Phase B.
    All reads go through the engine API.
4.  No client component imports src/lib/engine/client.ts. Enforced by `import "server-only"`.
5.  No JOURNALKIT_API_KEY in client-reachable code. Ever.
6.  Reading measure capped at 66ch. Wider screens get margin, not longer lines.
7.  Vertical is the navigation axis. No horizontal scroll, no second nav axis.
8.  One red accent (--color-dot). No second accent anywhere.
9.  Serif = author (data-text-origin="canonical"). Mono = system (data-text-origin="generated").
10. Provenance lives in the DOM. Generated text NEVER reads as author prose.
11. Copy Prompt is client-side and never fails. No network dependency.
12. AI is summoned from focus. Dwell may reveal; dwell never commits.
13. Schema changes happen in journalkit, never here. TII has no schema.
14. No state / data-fetching / form / test library without an explicit decision.
15. Push to main only with explicit user authorization.
16. CanonicalBody is the only `dangerouslySetInnerHTML` site. Don't add others.
17. The engine sanitizes HTML (PRD §9 D16). TII does NOT re-sanitize.
```

---

## 18. Out of scope (Phase B)

Deliberately not built in Phase B. Each is on the table for Phase C+.

- Thought Card generation (live AI; `POST /api/v1/synthesize/thought-card`)
- Local Constellation rendering with reasons
- Selection → live generation (only client-side Copy Prompt template ships in B)
- Studio bridge beyond a static footer link
- Visitor tables: `pinned_until`, `pages`, `site_status`
- `usage_events` ingestion (no telemetry without explicit decision)
- RSS / Atom feed
- Search
- Reader accounts / authenticated reading
- Embeddings / semantic auto-branching
- Playwright test suite
- Re-sanitization of body HTML (engine owns the boundary)

---

## 19. For a new agent / engineer joining

Suggested first 45 minutes:

1. Read this file end-to-end.
2. Read `~/Desktop/session2_tii/canonical_prd.md` §8, §9, §13, §14, §15, §17, §18.
3. Open `~/Desktop/session2_tii/journalkit_responsive_reader.html` in a browser. Scroll, watch the dot, settle on an entry, hit Enter. Internalize the feel.
4. Visit the current preview URL (the latest `feat/phase-b-scaffold` Vercel deploy) and compare against the prototype.
5. `cd /Users/zw/Desktop/tii && pnpm install && pnpm dev`. Open `http://localhost:3000`. Disable JavaScript in DevTools. Confirm reading still works.
6. Read `src/lib/engine/client.ts` + `src/components/reader/ReaderControlsIsland.tsx` — the BFF boundary and the one client island.
7. Before opening a PR: `pnpm typecheck && pnpm lint && pnpm build` all clean.

When in doubt, mirror the prototype's pattern with proper semantics + provenance + JS-off-readable progressive enhancement. When you must diverge, document the divergence here.
