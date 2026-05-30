# CLAUDE.md — `wangzi/z` (`z.stillinlove.co` design exploration)

> **Audience:** Claude Code agents + human engineers (UXD + SWE) joining the project.
> **Status as of 2026-05-29:** Transitional. This repo currently hosts `z.stillinlove.co` with a placeholder + 3 design exploration branches. After the V1 cutover (see `~/journalkit/CLAUDE.md` §12), the domain moves off this repo onto the `journalkit` Vercel project, and this repo becomes a **design archive**.

---

## 1. What this repo is

A **design-exploration sandbox** for the visual direction of `z.stillinlove.co`. Created 2026-05-27 as the initially-planned site repo before the architecture was clarified on 2026-05-29 to **"`z.stillinlove.co` = the journalkit deployment, internally codenamed TII (Temporal Intent Interface)"** (see `~/journalkit/CLAUDE.md` §15, §18).

What lives here today:

- A minimal **placeholder** page on `main` (currently served by the live `z.stillinlove.co`).
- Three **design direction branches**, each a complete home + about page with mock content, demonstrating a distinct visual idiom:
  - `design/editions` — literary serif, cream paper / ink, centered narrow column.
  - `design/dispatch` — editorial-magazine, white + vermilion accent, asymmetric grid + hero featured block.
  - `design/log` — raw / monospace, dark, timestamp-forward, terminal-diaristic.

After the V1 design pick:

- The **winning direction** gets folded into `~/journalkit/src/app/page.tsx` + `src/app/globals.css` (and the matching `/post/[slug]/page.tsx`). Authority for the live site moves to journalkit.
- This repo is **kept as an archive**, not deleted. The 3 design branches are the diff that future "what did we try?" questions resolve against.

This repo is **not** the production codebase. **Do not** add new product features here. Net-new work goes into `~/journalkit`.

---

## 2. Repo & branches

| | |
|---|---|
| GitHub | `https://github.com/wangzi/z` |
| Local working tree | `/Users/zw/Desktop/z.stillinlove.co/` |
| Visibility | Private |
| Default branch | `main` |
| Commit trailer | `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` |
| Pushing to `main` | Requires explicit per-push user authorization, same rule as journalkit |

### Current branches

| Branch | Last commit | What's there |
|---|---|---|
| `main` | scaffold: minimal Next 15 + Tailwind v4 placeholder ("z. — a journal — coming soon") | Production HEAD; this is what `z.stillinlove.co` serves today |
| `design/editions` | direction A — literary serif, cream/ink | Home + `/about`, mock 6-post content, visitor sort toggle, pinned slot |
| `design/dispatch` | direction B — editorial grid, vermilion accent | Home + `/about`, hero featured block, 2-col list, uppercase kickers |
| `design/log` | direction C — raw monospace, dark | Home + `/about`, timestamp-forward rows, `[pinned]` inline tag |
| `docs/claude-md` | THIS file | This handover doc; merge to `main` after review |

All 4 branches are pushed to `origin`. No long-lived feature branches.

---

## 3. The three design directions (live preview URLs)

Vercel SSO/Deployment Protection has been **disabled** on this project so these URLs are publicly clickable. (See §6 — re-enable before retiring.)

| Direction | Preview URL | Vibe |
|---|---|---|
| A — Editions | https://z-stillinlove-4kvvaxw6k-halftimes-projects.vercel.app | Quiet, bookish. Cream paper, serif body, narrow column. Pinned slot uses a small clay-colored label; date leads each entry; sort is an understated "newest / oldest" text toggle. |
| B — Dispatch | https://z-stillinlove-nqj5k7rf0-halftimes-projects.vercel.app | Confident, art-directed. White + vermilion. Pinned post is a full-width hero with a big index numeral; remaining entries fall into a 2-column grid with uppercase date kickers. "Now" runs as a ruled strip under the masthead. |
| C — Log | https://z-stillinlove-a9c7dql3l-halftimes-projects.vercel.app | Indie-web, software-person honesty. Dark, monospace. `> now:` status line; `[pinned]` inline tag; dense `2026-05-20 title` rows; `sort: [newest] oldest` toggle. Lowercase throughout. |

Each shows all four visitor surfaces the V1 spec requires: Now-line, pinned entry, visitor sort toggle (default newest), `/about` link.

**Pick one.** Once chosen, the next pass folds the chosen `globals.css` (palette + font stack) + the `page.tsx` shape into `~/journalkit/src/app/`. The mock posts get replaced by the real Supabase query (`posts.body_md` enriched with `profiles.display_name` per existing journalkit pattern).

---

## 4. Tech stack

This repo intentionally **mirrors journalkit's stack** so the chosen design direction folds in cleanly with no version skew:

| Layer | Package | Version | Source of truth |
|---|---|---|---|
| Runtime | Node | `>= 20` | matches journalkit |
| Package manager | pnpm | `10.33.2` (pinned via `packageManager`) | matches journalkit |
| Framework | `next` | `^15.1.0` (currently resolves to `15.5.18`) | matches journalkit |
| UI | `react` / `react-dom` | `^19.0.0` | matches journalkit |
| Styling | `tailwindcss` + `@tailwindcss/postcss` | `^4.0.0` | matches journalkit |
| TS | `typescript` | `^5.7.0`, `strict: true` | matches journalkit |

No Supabase, no shadcn primitives, no markdown pipeline, no auth — this is a static design exploration. All of those come from journalkit when the design folds in.

`vercel.json` declares `"framework": "nextjs"`; nothing else.

---

## 5. State management / architecture (current)

Bare bones, because it's a design playground.

- **Server components by default.** The placeholder home (`main`) is a server component.
- **Client islands for the sort toggle** on each design branch (the home `page.tsx` is `"use client"` so `useState<"newest" | "oldest">` works).
- **No global store, no data fetching, no auth.** Mock `POSTS` array inlined at the top of each `page.tsx`.
- **No middleware.** Tailwind v4 CSS-first config inlined in `src/app/globals.css` (no `tailwind.config.ts` needed beyond an empty `content` array).

When the design folds into journalkit, the sort toggle stays client; the post array becomes a server-fetched `supabase.from('posts')` query; the pinned slot reads `pinned_until > now()` (see `~/journalkit/CLAUDE.md` §18.2 schema additions).

---

## 6. Production deployment — current state

| Component | Current value |
|---|---|
| Domain | `z.stillinlove.co` (HTTPS, Let's Encrypt cert via Vercel, provisioned 2026-05-27) |
| DNS | Cloudflare zone `stillinlove.co`. CNAME `z` → `cname.vercel-dns.com` (DNS only / grey cloud). TXT `_vercel` for ownership. |
| Hosting | Vercel project `halftimes-projects/z-stillinlove-co` (project id `prj_tzy28JUf3r3YTwRWlOc0rRm4QcaJ`, org id `team_nZ8fnMqrDpAXYrHv7umjYMes`) |
| Source repo | `wangzi/z`, branch `main` (auto-deploys on push) |
| Vercel SSO / Deployment Protection | **Disabled** (PATCH `/v9/projects/z-stillinlove-co` with `{"ssoProtection": null}` on 2026-05-27) — required so the 3 design previews are publicly shareable. Re-enable when this repo retires from prod. |
| Vercel team | `halftimes-projects`. User logged in as `ziwang`. |

Note: this Vercel project's name (`z-stillinlove-co`) is misleading post-cutover — the V1 production deployment of `z.stillinlove.co` will come from a **different** Vercel project (`journalkit`, to be provisioned per `~/journalkit/CLAUDE.md` §12). This project is the **placeholder** host until then.

---

## 7. V1 cutover (what happens to this repo)

When the V1 cutover runs (see `~/journalkit/CLAUDE.md` §12 step-by-step):

1. The chosen design direction is **folded into journalkit** — `globals.css` (palette + font stack) + `page.tsx` shape + `about/page.tsx` shape carry over.
2. `z.stillinlove.co` is **detached** from this Vercel project and **attached** to the new `journalkit` Vercel project.
3. This Vercel project (`z-stillinlove-co`) is either **deleted** or **renamed** (e.g. to `z-design-archive`). It will no longer serve a custom domain.
4. This GitHub repo (`wangzi/z`) is **kept**, not deleted. The 3 design branches stay as the historical record of what was tried.
5. SSO / Deployment Protection is **re-enabled** here (no public preview need any more).

**After cutover, no new product code should land here.** If the design needs further iteration, that work happens in `~/journalkit` (on `feat/design-*` branches) — not in this repo.

---

## 8. File tree

```
/Users/zw/Desktop/z.stillinlove.co
├── CLAUDE.md                ← this file
├── README.md                Local dev quickstart
├── package.json             Pinned to journalkit's stack (Next 15, React 19, Tailwind 4, TS 5.7, pnpm 10.33.2)
├── pnpm-lock.yaml
├── tsconfig.json            Strict, @/* → ./src/*
├── next.config.mjs          reactStrictMode only
├── postcss.config.mjs       @tailwindcss/postcss
├── vercel.json              { "framework": "nextjs" }
├── .gitignore               (includes .vercel)
├── .vercel/                 project link → halftimes-projects/z-stillinlove-co
└── src/
    └── app/
        ├── layout.tsx       Root layout, sets <title>z.</title> + noindex robots meta
        ├── globals.css      Tailwind import + body palette/font (varies per branch)
        └── page.tsx         Home (varies per branch)
                             — main:               placeholder ("z. — a journal — coming soon")
                             — design/editions:    literary serif, with mock posts + sort + pinned
                             — design/dispatch:    editorial grid, with mock posts + sort + hero
                             — design/log:         raw monospace, with mock posts + sort + [pinned]
        └── about/page.tsx   Stub /about (present on design branches; not on main)
```

---

## 9. Local dev

```bash
cd /Users/zw/Desktop/z.stillinlove.co
pnpm install
pnpm dev               # http://localhost:3000
pnpm typecheck         # tsc --noEmit
pnpm build             # next build (validates before deploy)
```

To preview a design direction locally:

```bash
git checkout design/editions   # or design/dispatch / design/log
pnpm dev
```

Switching between branches doesn't require reinstalling — they share the same lockfile.

---

## 10. Hard rules

1. **No product features in this repo.** New TII V1 work belongs in `~/journalkit`. This repo is design-only.
2. **Do not delete the design branches** (`design/editions`, `design/dispatch`, `design/log`). They're the V1 design record.
3. **Do not push to `main` without explicit user authorization** — matches the journalkit rule.
4. **Do not re-enable SSO / Deployment Protection while the 3 design previews are still being evaluated.** Once the design pick is made and the cutover starts, re-enable it.
5. **Do not point `z.stillinlove.co` away from Vercel** (e.g. flipping the Cloudflare CNAME's proxy to orange before V1) — Vercel needs DNS-only mode for its Let's Encrypt cert reissuance.

---

## 11. Adjacent projects

- **journalkit** — `/Users/zw/journalkit`, `https://github.com/wangzi/journalkit`. The V1 production codebase. **Read `~/journalkit/CLAUDE.md` for the full stack and TII V1 scope.** Everything here flows into that repo.
- **Atomic** — `/Users/zw/Desktop/Atomic`. iOS voice-capture app. Unrelated codebase that cohabits the same user account.
- **Halftime** — `/Users/zw/halftime`. Multi-tenant social feed; journalkit's pattern source. Read-only; never touched from here.

---

## 12. Session log — how this repo got here (2026-05-27 → 2026-05-29)

For agents picking up the work cold, a short trail of the decisions that shaped this repo's role:

1. **2026-05-27** — User requests a new subdomain `z.stillinlove.co` as a personal journal/blog, to be powered by "the new journalkit being developed." This repo created from scratch with Next 15 + Tailwind v4 placeholder. GitHub repo `wangzi/z` (private) provisioned. Vercel project `halftimes-projects/z-stillinlove-co` created and linked. Cloudflare DNS records added (CNAME `z`, TXT `_vercel`). Domain verified by Vercel; cert issued. `z.stillinlove.co` live with placeholder.
2. **2026-05-27** — User picks **"Three contrasting directions"** for design exploration. Three branches built (`design/editions`, `design/dispatch`, `design/log`), each deployed as a Vercel preview. Vercel SSO protection disabled so previews are publicly viewable.
3. **2026-05-28** — User asks for a full V1 handover document (stack, repos, branches, conventions) for journalkit and z.stillinlove.co. Architecture clarified: **journalkit will deploy at z.stillinlove.co** (matching journalkit's existing CLAUDE.md §12); **wangzi/z is reframed as design exploration only**; TII is **the internal codename for the V1 work as a whole** (not a separate repo). This file written on the `docs/claude-md` branch.

The chronology matters for one reason: **journalkit's existing CLAUDE.md §12 ("Production deployment — z.stillinlove.co") was written assuming the V1 target state**, not the 2026-05-27 placeholder state. Agents reading both docs together should treat journalkit as authoritative for the V1 target, and this doc as authoritative for the current (transitional) reality.

---

## 13. For a new agent / engineer joining

Suggested first 15 minutes:

1. Read this file end-to-end.
2. Read `~/journalkit/CLAUDE.md` end-to-end. Sections 12 and 18 are the V1 cutover + scope additions.
3. `git log --oneline --all` here — sparse but shows the 3 design branches.
4. Visit the 3 preview URLs (§3). Form a real opinion before discussing design with the team.
5. Open the production site `https://z.stillinlove.co` — confirm it's currently the placeholder.
6. Before opening a PR here, ask: "should this go in journalkit instead?" (For anything that isn't strictly the design exploration, yes.)
