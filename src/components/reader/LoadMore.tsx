"use client";

// Load-more island. A button below the SSR feed; each click fetches the next
// engine page through the server BFF route (/api/v1/posts — which keeps
// JOURNALKIT_API_KEY server-only) and PORTALS the new entries into the existing
// <ol id="feed"> so they join the same list with no seam. Hides when
// next_cursor is null. Fails soft (keeps what's shown; the button retries).
//
// One engine page per request — no batch/loop. The reader renders whatever the
// engine returns and follows next_cursor, so it works whether the engine page
// size is 50 or 100 (journalkit #17).
//
// Progressive enhancement: returns null until mounted, so JS-off visitors get
// the SSR first page with NO button. In page.tsx this island is keyed by
// sort+filter, so changing either remounts it → pagination resets to page 1.
//
// Filter: the engine page is fetched corpus-wide (the SSR cursor is corpus-wide
// too) and the SAME client-side predicate as page.tsx is applied before
// appending — i.e. "filter only what's loaded", consistent with the SSR feed,
// which also filters its first page in-component. (Documented limitation: a
// filtered Load-more advances through the corpus a page at a time.)

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { PostSummary, SortOrder } from "@/lib/engine/types";

import { EntryItem } from "./EntryItem";

function matchesFilter(post: PostSummary, filter: string | null): boolean {
  if (!filter) return true;
  return (post.topics ?? []).includes(filter) || post.intent_label === filter;
}

export function LoadMore({
  sort,
  filter,
  initialCursor,
  initialCount,
  now,
}: {
  sort: SortOrder;
  filter: string | null;
  initialCursor: string | null;
  /** Count of SSR entries already in #feed → first appended data-entry-index. */
  initialCount: number;
  now: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [feedEl, setFeedEl] = useState<HTMLElement | null>(null);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [items, setItems] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  // Go easter egg: each loaded page is a placed stone, Black first then
  // alternating — so `moves` doubles as the move count and stone parity.
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    setMounted(true);
    setFeedEl(document.getElementById("feed"));
  }, []);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const params = new URLSearchParams({ sort, cursor });
      const res = await fetch(`/api/v1/posts?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        posts: PostSummary[];
        next_cursor: string | null;
      };
      const incoming = data.posts.filter((p) => matchesFilter(p, filter));
      setItems((prev) => [...prev, ...incoming]);
      setCursor(data.next_cursor);
      setMoves((m) => m + 1); // a stone is placed
    } catch {
      setFailed(true); // fail soft — keep what's shown; the button retries
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, sort, filter]);

  // JS-off + pre-hydration: render nothing, so the SSR first page stands alone
  // with no (non-functional) button.
  if (!mounted) return null;

  return (
    <>
      {feedEl
        ? createPortal(
            items.map((post, k) => (
              <EntryItem
                key={post.post_id}
                post={post}
                index={initialCount + k}
                now={now}
              />
            )),
            feedEl,
          )
        : null}
      {cursor !== null ? (
        <div className="load-more-wrap">
          {/* The game record: one stone per page loaded, Black first. */}
          {moves > 0 ? (
            <div
              className="go-record"
              aria-hidden="true"
              title={`${moves} ${moves === 1 ? "move" : "moves"} played`}
            >
              {Array.from({ length: moves }, (_, i) => (
                <span
                  key={i}
                  className={`go-stone${i % 2 === 0 ? " is-black" : " is-white"}`}
                />
              ))}
            </div>
          ) : null}
          <button
            type="button"
            className="load-more"
            onClick={() => void loadMore()}
            disabled={loading}
            aria-busy={loading}
            aria-label="Load more entries"
          >
            <span
              className={`load-more-stone${moves % 2 === 0 ? " is-black" : " is-white"}`}
              aria-hidden="true"
            />
            <span className="load-more-text">
              {loading ? "Reading…" : "Load more"}
            </span>
          </button>
          {failed ? (
            <span className="load-more-error" role="alert">
              Couldn’t load more — tap to retry.
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
