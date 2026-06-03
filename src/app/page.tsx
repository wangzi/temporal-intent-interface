// Archive index — public reverse-chronological feed of published
// posts. SSR per PRD §17.4: renders fully without JavaScript.
//
// ISR with revalidate=60 so anonymous readers always get a fresh
// snapshot at most a minute stale. The engine client validates the
// response against the §9 contract; on error we render an empty
// state rather than crash.
//
// Filtering: the engine call is always unfiltered so that the
// NavigationRail can list every intent_label as a filter option;
// the visible <ol> is filtered in-component when ?filter=... is set.

import { listPosts } from "@/lib/engine/client";
import { daysAgo, postYear } from "@/lib/format";
import type { PostSummary, SortOrder } from "@/lib/engine/types";

import { Dot } from "@/components/reader/Dot";
import { NavigationRail } from "@/components/reader/NavigationRail";
import { ReaderControlsIsland } from "@/components/reader/ReaderControlsIsland";
import { Spine } from "@/components/reader/Spine";
import { TemporalLayout } from "@/components/reader/TemporalLayout";
import { TerminalHero } from "@/components/reader/TerminalHero";
import { TerminalHeroIsland } from "@/components/reader/TerminalHeroIsland";
import { TitleIntentLayer } from "@/components/reader/TitleIntentLayer";
import { TopBar } from "@/components/reader/TopBar";

export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const sort: SortOrder = sp.sort === "oldest" ? "oldest" : "newest";
  const filter = sp.filter && sp.filter !== "all" ? sp.filter : undefined;

  // Server-stable "now" for relative-ago strings within this SSR.
  const now = Date.now();

  let allPosts: PostSummary[] = [];
  try {
    const response = await listPosts({ sort });
    allPosts = response.posts;
  } catch (err) {
    // Engine error — render an empty archive rather than blow up.
    // eslint-disable-next-line no-console
    console.error("[home] engine error:", err);
  }

  const visiblePosts = filter
    ? allPosts.filter((p) => p.intent_label === filter)
    : allPosts;

  // Head-of-spine stats for the terminal hero, derived from the whole archive
  // (unfiltered, and sort-independent — `sort` may be "oldest").
  // CAVEAT: PostsListResponse has no `total` field (engine/types.ts), so this
  // is the LOADED page only. Today the engine returns the full set unpaginated
  // so it equals the true total; once it paginates this undercounts.
  // TODO(engine): surface a real `total` and pass it instead of length (Q7/Q9).
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
        <NavigationRail
          posts={allPosts}
          currentFilter={filter}
          currentSort={sort}
        />
      }
    >
      <Spine />
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
          <li
            key={p.post_id}
            className="entry"
            data-entry-index={i}
            data-year={postYear(p.published_at)}
            data-label={p.intent_label}
          >
            <TitleIntentLayer post={p} now={now} />
          </li>
        ))}
        {visiblePosts.length === 0 ? (
          <li
            style={{
              padding: "5.5vh 0 5.5vh var(--content-pad)",
              fontFamily: "var(--mono)",
              fontSize: "0.8125rem",
              color: "var(--system-faint)",
            }}
          >
            {filter ? `No entries for ${filter}.` : "No entries."}
          </li>
        ) : null}
      </ol>
      {/* Footer hidden for now — FooterReview render removed. */}
      <Dot />
      <ReaderControlsIsland />
      <TerminalHeroIsland />
    </TemporalLayout>
  );
}
