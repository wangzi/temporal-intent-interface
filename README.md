# tii — Temporal Intent Interface

The public reader at **`z.stillinlove.co`**. A temporal-first reader that treats reading as an active, AI-native operation: vertical = time, horizontal = layout, attention is a fixed red dot through which content flows. Consumes journalkit's read API server-side via a BFF; holds no durable content or intent state.

**Internal codename:** TII (Temporal Intent Interface). **Public name:** "z.".

---

## Setup

```bash
pnpm install
cp .env.example .env.local
# Phase B default: JOURNALKIT_FIXTURE_MODE=true uses local fixtures.
pnpm dev
```

Opens at `http://localhost:3000`.

```bash
pnpm typecheck   # tsc --noEmit, strict + noUncheckedIndexedAccess
pnpm lint        # next lint
pnpm build       # next build (production verification)
```

## Architecture

```
anonymous browser
       │
       ▼
TII (Next.js 15) ───server-to-server───▶ journalkit engine
SSR + 1 client island                    studio.stillinlove.co
z.stillinlove.co                         (Phase A, separate repo)
```

- SSR pages call `engine.listPosts()` / `engine.getPost()` directly via `src/lib/engine/client.ts` (server-only).
- `JOURNALKIT_API_KEY` is server-side; the browser never sees it.
- Fixture mode (`JOURNALKIT_FIXTURE_MODE=true`) routes engine calls to local JSON, so the reader can be developed before the engine API is live.

See `CLAUDE.md` for the full handover.

## Deploy

`feat/<topic>` branches → push → Vercel auto-deploys a preview. Merge to `main` only with explicit authorization (PRD §17.12).

Production: `https://z.stillinlove.co` (Vercel project `halftimes-projects/z-stillinlove-co`).

## License

MIT — see `LICENSE`.
