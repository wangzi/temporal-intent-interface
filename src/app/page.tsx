// Archive index — public reverse-chronological feed of published
// posts. SSR per PRD §17.4: renders fully without JavaScript.
//
// ISR with revalidate=60 so anonymous readers always get a fresh
// snapshot at most a minute stale. The engine client validates the
// response against the §9 contract; on error we render an empty
// state rather than crash.

import { listPosts } from "@/lib/engine/client";
import { postYear } from "@/lib/format";
import type { PostSummary, SortOrder } from "@/lib/engine/types";

import { Dot } from "@/components/reader/Dot";
import { Footer } from "@/components/reader/Footer";
import { ReaderControlsIsland } from "@/components/reader/ReaderControlsIsland";
import { Spine } from "@/components/reader/Spine";
import { TemporalLayout } from "@/components/reader/TemporalLayout";
import { TitleIntentLayer } from "@/components/reader/TitleIntentLayer";

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

  let posts: PostSummary[] = [];
  try {
    const response = await listPosts({ sort, filter });
    posts = response.posts;
  } catch (err) {
    // Engine error — render an empty archive rather than blow up.
    // Real error reporting lands in a later step.
    // eslint-disable-next-line no-console
    console.error("[home] engine error:", err);
  }

  return (
    <TemporalLayout>
      <Spine />
      <p className="now-label">Now · latest</p>
      <ol
        id="feed"
        aria-label="Entries in reverse chronological order"
        style={{ listStyle: "none" }}
      >
        {posts.map((p, i) => (
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
        {posts.length === 0 ? (
          <li
            style={{
              padding: "5.5vh 0 5.5vh var(--content-pad)",
              fontFamily: "var(--mono)",
              fontSize: "0.8125rem",
              color: "var(--system-faint)",
            }}
          >
            No entries.
          </li>
        ) : null}
      </ol>
      <Footer />
      <Dot />
      <ReaderControlsIsland />
    </TemporalLayout>
  );
}
