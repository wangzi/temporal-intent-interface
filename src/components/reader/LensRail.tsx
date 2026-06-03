"use client";

// LensRail — the reader's left control plane.
//
// SSR-preserving (matches the project's JS-off hard rule):
//   • Sort + Topics are URL-driven <Link>s (?sort=, ?filter=) → the server
//     re-renders the feed. They work with JS off.
//   • Search is a client-only, non-destructive hide over the SSR-rendered
//     <li data-entry-index> entries — it never refetches or removes content.
//
// Keeps NavigationRail's shell (`.rail` / `#reader-rail`) so TopBar's mobile
// hamburger, scrim, body.nav-open, and Escape-to-close keep working.
//
// (Snapshot create + the "Your snapshots" list + Google sign-in were removed —
// snapshot links are one-time shares, not a managed collection, so the surface
// was dropped from the reader to keep the rail uncluttered. The public
// /s/[token] route still renders any links that exist.)

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { matchPost } from "@/lib/lens/search";
import type { PostSummary, SortOrder } from "@/lib/engine/types";

// Build a "/" URL that preserves the other facet — same contract page.tsx reads.
function facetHref(filter: string | null, sort: SortOrder): string {
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  if (sort === "oldest") params.set("sort", "oldest");
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function LensRail({
  posts,
  topics,
  currentFilter,
  currentSort,
}: {
  posts: PostSummary[];
  topics: string[];
  currentFilter: string | null;
  currentSort: SortOrder;
}) {
  const [query, setQuery] = useState("");

  // Search matches over the server-ordered set. Index = render order in #feed.
  const matches = useMemo(
    () =>
      posts
        .map((post, index) => ({ post, index }))
        .filter(({ post }) => matchPost(post, query)),
    [posts, query],
  );

  // Apply search as a non-destructive hide of the SSR entries. Restore on
  // unmount so a route change never leaves entries hidden.
  useEffect(() => {
    const visible = new Set(matches.map((m) => m.index));
    document
      .querySelectorAll<HTMLElement>("#feed [data-entry-index]")
      .forEach((el) => {
        const idx = Number(el.getAttribute("data-entry-index"));
        // Entries appended by the Load-more island (idx beyond the rail's
        // first-page `posts`) aren't in the search set — leave them visible.
        if (idx >= posts.length) return;
        el.style.display = visible.has(idx) ? "" : "none";
      });
    return () => {
      document
        .querySelectorAll<HTMLElement>("#feed [data-entry-index]")
        .forEach((el) => {
          el.style.display = "";
        });
    };
  }, [matches, posts.length]);

  return (
    <nav className="rail" id="reader-rail" aria-label="Reader navigation">
      <span className="brand">
        z<b>.</b>
      </span>

      <div className="rail-section">
        <h2>Search</h2>
        <input
          className="lens-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter entries…"
          aria-label="Search entries"
        />
      </div>

      <div className="rail-section">
        <h2>Sort</h2>
        <Link
          className={`navlink${currentSort === "newest" ? " on" : ""}`}
          href={facetHref(currentFilter, "newest")}
          aria-current={currentSort === "newest" ? "page" : undefined}
        >
          Now → Past
        </Link>
        <Link
          className={`navlink${currentSort === "oldest" ? " on" : ""}`}
          href={facetHref(currentFilter, "oldest")}
          aria-current={currentSort === "oldest" ? "page" : undefined}
        >
          Past → Now
        </Link>
      </div>

      <div className="rail-section">
        <h2>Topics</h2>
        <Link
          className={`navlink${!currentFilter ? " on" : ""}`}
          href={facetHref(null, currentSort)}
          aria-current={!currentFilter ? "page" : undefined}
        >
          All topics
        </Link>
        {topics.map((topic) => (
          <Link
            key={topic}
            className={`navlink${currentFilter === topic ? " on" : ""}`}
            href={facetHref(topic, currentSort)}
            aria-current={currentFilter === topic ? "page" : undefined}
          >
            {topic}
          </Link>
        ))}
      </div>
    </nav>
  );
}
