// Archive index — public reverse-chronological feed of published posts, plus
// Lens search + topic-filter modes.
//
// SSR per PRD §17.4: renders fully without JavaScript. ISR revalidate=60 so
// anonymous readers get an at-most-minute-stale snapshot. Every engine call is
// validated against the §9 contract; on error we render an empty state rather
// than crash.
//
// Modes (driven by the URL):
//   • Default feed        — no ?q and no ?topics. Reverse-chron list + Load-more.
//     An optional ?filter= still narrows by intent label (TopBar's mobile nav).
//   • Search / topic view — ?q= and/or ?topics= present. Results come from
//     journalkit /api/v1/search (body-aware text + OR topic filter), rendered
//     with the engine's snippets. No Load-more (search returns a capped set).
//
// The LensRail (search box + real topic facets + sort + Snap) renders in every
// mode; its facets come from journalkit /api/v1/topics and Snap freezes the
// currently-rendered set (the search results in result order, or the feed).

import { listPosts, listTopics, searchPosts } from "@/lib/engine/client";
import { daysAgo } from "@/lib/format";
import type {
  PostSummary,
  SearchResult,
  SortOrder,
  TopicFacet,
} from "@/lib/engine/types";

import { Dot } from "@/components/reader/Dot";
import { EntryItem } from "@/components/reader/EntryItem";
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

function parseTopics(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    topics?: string;
    q?: string;
    filter?: string;
  }>;
}) {
  const sp = await searchParams;
  const sort: SortOrder = sp.sort === "oldest" ? "oldest" : "newest";
  const query = (sp.q ?? "").trim();
  const selectedTopics = parseTopics(sp.topics);
  const searchMode = query.length > 0 || selectedTopics.length > 0;

  // Server-stable "now" for relative-ago strings within this SSR.
  const now = Date.now();

  // Topic facets for the rail (every mode) — real journalkit /api/v1/topics.
  let facets: TopicFacet[] = [];
  try {
    facets = (await listTopics()).topics;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[home] topics error:", err);
  }

  // ── Search / topic-filter mode ────────────────────────────────────────────
  if (searchMode) {
    let results: SearchResult[] = [];
    try {
      results = (
        await searchPosts({ q: query || undefined, topics: selectedTopics })
      ).results;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[home] search error:", err);
    }

    // Keep the status line terse: name the topics when there are a few, but
    // collapse to a count past 3 so it never becomes a wall of caps. The active
    // topics are also shown (highlighted) in the rail's Topics list.
    const topicCriteria =
      selectedTopics.length === 0
        ? null
        : selectedTopics.length <= 3
          ? selectedTopics.join(", ")
          : `${selectedTopics.length} topics`;
    const criteria = [query ? `“${query}”` : null, topicCriteria]
      .filter(Boolean)
      .join(" · ");
    const heading =
      results.length === 0
        ? "No results"
        : `${results.length} result${results.length === 1 ? "" : "s"}`;

    return (
      <TemporalLayout
        topBar={<TopBar posts={results} />}
        rail={
          <LensRail
            posts={results}
            facets={facets}
            selectedTopics={selectedTopics}
            query={query}
            currentSort={sort}
          />
        }
      >
        <Spine />
        <SpineSort
          currentSort={sort}
          query={query}
          selectedTopics={selectedTopics}
        />
        <ol id="feed" aria-label="Search results" style={{ listStyle: "none" }}>
          <li className="feed-status">
            {heading}
            {criteria ? ` · ${criteria}` : ""}
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
            <li className="feed-empty">
              No entries match {criteria || "your search"}.
            </li>
          ) : null}
        </ol>
        <Dot />
        <ReaderControlsIsland />
      </TemporalLayout>
    );
  }

  // ── Default feed ──────────────────────────────────────────────────────────
  const filter = sp.filter && sp.filter !== "all" ? sp.filter : undefined;

  let allPosts: PostSummary[] = [];
  let nextCursor: string | null = null;
  try {
    const response = await listPosts({ sort });
    allPosts = response.posts;
    nextCursor = response.next_cursor;
  } catch (err) {
    // Engine error — render an empty archive rather than blow up.
    // eslint-disable-next-line no-console
    console.error("[home] engine error:", err);
  }

  // ?filter= (intent label) is the legacy in-component narrow that TopBar's
  // mobile nav still emits; the desktop rail now uses ?topics= instead. Kept so
  // the existing feed behavior is preserved when no ?q / ?topics is present.
  const visiblePosts = filter
    ? allPosts.filter(
        (p) => (p.topics ?? []).includes(filter) || p.intent_label === filter,
      )
    : allPosts;

  // Head-of-spine stats for the terminal hero, derived from the whole archive.
  const totalEntriesCount = allPosts.length;
  const latestIso =
    allPosts.length > 0
      ? allPosts.reduce(
          (max, p) => (p.published_at > max ? p.published_at : max),
          allPosts[0]!.published_at,
        )
      : null;
  const lastEntryDays = latestIso ? daysAgo(latestIso, now) : 0;

  return (
    <TemporalLayout
      topBar={<TopBar posts={allPosts} currentFilter={filter} />}
      rail={
        <LensRail
          posts={visiblePosts}
          facets={facets}
          selectedTopics={selectedTopics}
          query={query}
          currentSort={sort}
        />
      }
    >
      <Spine />
      <SpineSort
        currentSort={sort}
        query={query}
        selectedTopics={selectedTopics}
      />
      {allPosts.length > 0 ? (
        <TerminalHero
          lastEntryDays={lastEntryDays}
          totalEntriesCount={totalEntriesCount}
        />
      ) : null}
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
      {/* Footer hidden for now — FooterReview render removed. */}
      <Dot />
      <ReaderControlsIsland />
      <TerminalHeroIsland />
    </TemporalLayout>
  );
}
