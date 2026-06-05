// Archive index — public reverse-chronological feed, plus Focus (journalkit's
// navigation surface) and free-text Search.
//
// SSR per PRD §17.4: renders fully without JavaScript. ISR revalidate=60. Every
// engine call is validated against the §9 contract; on error we render an empty
// state rather than crash.
//
// Modes (driven by the URL):
//   • Default feed   — no ?focus and no ?q. Reverse-chron list + Load-more.
//     An optional ?filter= still narrows by intent label (TopBar mobile nav).
//   • Focus route    — ?focus=<routeId>. Fetches the route's mapped entries
//     (GET /api/v1/focus/:routeId/entries), renders a route header + each
//     entry's mapping reason ("why this entry belongs here"). With ?q= too, it
//     searches *within* the route (GET /api/v1/search?q=&focus=) and shows both
//     the match snippet and the route reason.
//   • Search         — ?q= (no focus). Body-aware text search results.
//
// The LensRail (search + Snap + Focus routes) renders in every mode; its focus
// index comes from GET /api/v1/focus.

import {
  getFocusRoute,
  listFocus,
  listPosts,
  searchPosts,
} from "@/lib/engine/client";
import type {
  FocusResponse,
  FocusRouteResponse,
  PostSummary,
  SearchResult,
  SortOrder,
} from "@/lib/engine/types";

import { Dot } from "@/components/reader/Dot";
import { EntryItem } from "@/components/reader/EntryItem";
import { Footer } from "@/components/reader/Footer";
import { FocusRouteHeader } from "@/components/reader/FocusRouteHeader";
import { LensRail } from "@/components/reader/LensRail";
import { LoadMore } from "@/components/reader/LoadMore";
import { ReaderControlsIsland } from "@/components/reader/ReaderControlsIsland";
import { Spine } from "@/components/reader/Spine";
import { SpineSort } from "@/components/reader/SpineSort";
import { TemporalLayout } from "@/components/reader/TemporalLayout";
import { TerminalHero } from "@/components/reader/TerminalHero";
import { TerminalHeroIsland } from "@/components/reader/TerminalHeroIsland";
import { TopBar } from "@/components/reader/TopBar";

export const revalidate = 60;

const EMPTY_FOCUS: FocusResponse = { categories: [], routes: [] };

function resultCount(n: number): string {
  return `${n} result${n === 1 ? "" : "s"}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    focus?: string;
    q?: string;
    filter?: string;
  }>;
}) {
  const sp = await searchParams;
  const sort: SortOrder = sp.sort === "oldest" ? "oldest" : "newest";
  const query = (sp.q ?? "").trim();
  const activeRoute = (sp.focus ?? "").trim() || null;

  // Server-stable "now" for relative-ago strings within this SSR.
  const now = Date.now();

  // Focus index for the rail (every mode) — real journalkit /api/v1/focus.
  let focus: FocusResponse = EMPTY_FOCUS;
  try {
    focus = await listFocus();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[home] focus error:", err);
  }

  // ── Focus route mode ───────────────────────────────────────────────────────
  if (activeRoute) {
    let routeData: FocusRouteResponse | null = null;
    try {
      routeData = await getFocusRoute(activeRoute);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[home] focus route error:", err);
    }

    // entry_id → "Day {day} — {reason}" (first mapping per entry).
    const reasonById = new Map<string, string>();
    for (const m of routeData?.mappings ?? []) {
      if (reasonById.has(m.entry_id)) continue;
      const r = m.reason.trim();
      if (!r) continue;
      reasonById.set(m.entry_id, m.day ? `Day ${m.day} — ${r}` : r);
    }

    // Entries: the route's mapped entries, OR search-within-route results.
    let entries: PostSummary[] = routeData?.entries ?? [];
    const snippetById = new Map<string, string>();
    if (query) {
      let results: SearchResult[] = [];
      try {
        results = (await searchPosts({ q: query, focus: [activeRoute] }))
          .results;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[home] focus search error:", err);
      }
      entries = results;
      for (const r of results) snippetById.set(r.post_id, r.search.snippet);
    }

    return (
      <TemporalLayout
        topBar={<TopBar posts={entries} />}
        rail={
          <LensRail
            posts={entries}
            focus={focus}
            activeRoute={activeRoute}
            query={query}
            currentSort={sort}
          />
        }
      >
        <Spine />
        <SpineSort
          currentSort={sort}
          query={query}
          selectedTopics={[]}
          activeRoute={activeRoute}
        />
        {routeData ? <FocusRouteHeader route={routeData.route} /> : null}
        <ol
          id="feed"
          aria-label={
            routeData ? `${routeData.route.label} — entries` : "Focus route"
          }
          style={{ listStyle: "none" }}
        >
          {query ? (
            <li className="feed-status">
              {resultCount(entries.length)} · “{query}”
            </li>
          ) : null}
          {entries.map((p, i) => (
            <EntryItem
              key={p.post_id}
              post={p}
              index={i}
              now={now}
              snippet={snippetById.get(p.post_id)}
              reason={reasonById.get(p.post_id)}
            />
          ))}
          {entries.length === 0 ? (
            <li className="feed-empty">
              {query
                ? `No entries in this route match “${query}”.`
                : "No entries mapped to this route yet."}
            </li>
          ) : null}
        </ol>
        <Footer />
        <Dot />
        <ReaderControlsIsland />
      </TemporalLayout>
    );
  }

  // ── Search mode (free-text, no focus) ──────────────────────────────────────
  if (query) {
    let results: SearchResult[] = [];
    try {
      results = (await searchPosts({ q: query })).results;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[home] search error:", err);
    }
    const heading =
      results.length === 0 ? "No results" : resultCount(results.length);

    return (
      <TemporalLayout
        topBar={<TopBar posts={results} />}
        rail={
          <LensRail
            posts={results}
            focus={focus}
            activeRoute={null}
            query={query}
            currentSort={sort}
          />
        }
      >
        <Spine />
        <SpineSort currentSort={sort} query={query} selectedTopics={[]} />
        <ol id="feed" aria-label="Search results" style={{ listStyle: "none" }}>
          <li className="feed-status">
            {heading} · “{query}”
          </li>
          {results.map((r, i) => (
            <EntryItem
              key={r.post_id}
              post={r}
              index={i}
              now={now}
              snippet={r.search.snippet}
            />
          ))}
          {results.length === 0 ? (
            <li className="feed-empty">No entries match “{query}”.</li>
          ) : null}
        </ol>
        <Footer />
        <Dot />
        <ReaderControlsIsland />
      </TemporalLayout>
    );
  }

  // ── Default feed ───────────────────────────────────────────────────────────
  const filter = sp.filter && sp.filter !== "all" ? sp.filter : undefined;

  // Exhaust the archive so the head-of-spine stats (count + last entry) and the
  // footer reflect the TRUE total instead of just page-1 length, and JS-off
  // readers see every entry rather than the first ~100. The page is ISR
  // (revalidate=60), so the fan-out is amortized across all readers and runs at
  // most once per minute. Fail-soft: a mid-stream failure keeps the pages we
  // already loaded — better partial than empty. MAX_PAGES is a defensive cap
  // (= 20k posts at PAGE_SIZE 100); well above the engine's bounded scan.
  let allPosts: PostSummary[] = [];
  const nextCursor: string | null = null; // SSR drained → LoadMore is dormant.
  const MAX_PAGES = 200;
  try {
    let cursor: string | undefined;
    for (let i = 0; i < MAX_PAGES; i++) {
      const response = await listPosts({ sort, cursor });
      allPosts.push(...response.posts);
      if (!response.next_cursor) break;
      cursor = response.next_cursor;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[home] engine error:", err);
  }

  // ?filter= (intent label) is the legacy in-component narrow that TopBar's
  // mobile nav still emits. Kept so the existing feed behavior is preserved.
  const visiblePosts = filter
    ? allPosts.filter(
        (p) => (p.topics ?? []).includes(filter) || p.intent_label === filter,
      )
    : allPosts;

  return (
    <TemporalLayout
      topBar={<TopBar posts={allPosts} currentFilter={filter} />}
      rail={
        <LensRail
          posts={visiblePosts}
          focus={focus}
          activeRoute={null}
          query={query}
          currentSort={sort}
        />
      }
    >
      <Spine />
      {/* Spine head: the live-clock hero, then the sort toggle below it. */}
      {allPosts.length > 0 ? <TerminalHero /> : null}
      <SpineSort currentSort={sort} query={query} selectedTopics={[]} />
      <ol
        id="feed"
        aria-label="Entries in reverse chronological order"
        style={{ listStyle: "none" }}
      >
        {visiblePosts.map((p, i) => (
          <EntryItem key={p.post_id} post={p} index={i} now={now} />
        ))}
        {visiblePosts.length === 0 ? (
          <li className="feed-empty">
            {filter ? `No entries for ${filter}.` : "No entries."}
          </li>
        ) : null}
      </ol>
      <LoadMore
        key={`${sort}-${filter ?? "all"}`}
        sort={sort}
        filter={filter ?? null}
        initialCursor={nextCursor}
        initialCount={visiblePosts.length}
        now={now}
      />
      <Footer />
      <Dot />
      <ReaderControlsIsland />
      <TerminalHeroIsland />
    </TemporalLayout>
  );
}
