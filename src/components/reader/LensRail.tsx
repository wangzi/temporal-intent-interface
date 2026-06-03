"use client";

// LensRail — the reader's left control plane. Replaces NavigationRail.
//
// SSR-preserving model (matches the project's JS-off hard rule):
//   • Sort + Topics are URL-driven <Link>s (?sort=, ?filter=) → the server
//     re-renders the feed. These WORK with JS off, exactly like before.
//   • Search is a client-only, non-destructive hide over the SSR-rendered
//     <li data-entry-index> entries — it never refetches or removes content.
//   • Google sign-in + Snap are the only client-only-and-authed surfaces.
//
// The rail keeps NavigationRail's shell (`.rail` / `#reader-rail`) so TopBar's
// mobile hamburger, scrim, body.nav-open, and Escape-to-close all keep working
// untouched.
//
// Snapshot freeze uses the CURRENTLY VISIBLE entries' post_id (server sort +
// topic, minus client-hidden-by-search), in display order. This assumes a
// post_id equals its journalkit entry id; if not, the author-scoped POST 400s
// and the error surfaces in the rail.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Session } from "@supabase/supabase-js";

import {
  createSnapshot,
  listSnapshots,
  SnapshotError,
  type SnapshotMeta,
} from "@/lib/lens/api";
import { getSupabase } from "@/lib/lens/supabase";
import { matchPost } from "@/lib/lens/search";
import type { PostSummary, SortOrder } from "@/lib/engine/types";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

function originBase(): string {
  if (SITE) return SITE;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

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
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [query, setQuery] = useState("");
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [snapping, setSnapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Auth bootstrap (browser only — getSupabase is lazy).
  useEffect(() => {
    const sb = getSupabase();
    let active = true;
    void sb.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load the author's existing snapshots when signed in.
  useEffect(() => {
    if (!session) {
      setSnapshots([]);
      return;
    }
    let active = true;
    void listSnapshots(session.access_token)
      .then((list) => {
        if (active) setSnapshots(list);
      })
      .catch(() => {
        /* non-fatal: the create path still works */
      });
    return () => {
      active = false;
    };
  }, [session]);

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
    const items = document.querySelectorAll<HTMLElement>(
      "#feed [data-entry-index]",
    );
    items.forEach((el) => {
      const idx = Number(el.getAttribute("data-entry-index"));
      // Entries appended by the Load-more island (idx beyond the rail's
      // first-page `posts`) aren't in the search set — leave them visible
      // rather than hiding them.
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

  const signIn = useCallback(() => {
    void getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
  }, []);

  const signOut = useCallback(() => {
    void getSupabase().auth.signOut();
  }, []);

  const onSnap = useCallback(async () => {
    if (!session || matches.length === 0) return;
    setSnapping(true);
    setError(null);
    try {
      const ids = matches.map((m) => m.post.post_id);
      const snap = await createSnapshot(session.access_token, ids, {
        topics: currentFilter ? [currentFilter] : [],
        sort: currentSort,
        query: query.trim(),
      });
      setSnapshots((prev) => [snap, ...prev]);
    } catch (e) {
      setError(
        e instanceof SnapshotError
          ? `Snapshot failed (${e.status})`
          : "Snapshot failed",
      );
    } finally {
      setSnapping(false);
    }
  }, [session, matches, currentFilter, currentSort, query]);

  const onCopy = useCallback(async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${originBase()}/s/${token}`);
      setCopied(token);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable — the link is still openable */
    }
  }, []);

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

      <div className="rail-section">
        <h2>Snapshot</h2>
        <p className="lens-count">
          {matches.length} {matches.length === 1 ? "entry" : "entries"} in view
        </p>
        {!authReady ? null : session ? (
          <>
            <button
              type="button"
              className="lens-snap"
              onClick={() => void onSnap()}
              disabled={snapping || matches.length === 0}
            >
              {snapping ? "Snapping…" : "Snap this view"}
            </button>
            {error ? (
              <p className="lens-error" role="alert">
                {error}
              </p>
            ) : null}
          </>
        ) : (
          <button type="button" className="lens-signin" onClick={signIn}>
            Sign in with Google to Snap
          </button>
        )}
      </div>

      {session && snapshots.length > 0 ? (
        <div className="rail-section">
          <h2>Your snapshots</h2>
          <ul className="lens-snaps">
            {snapshots.map((snap) => (
              <li key={snap.token}>
                <a
                  className="lens-snap-link"
                  href={`/s/${snap.token}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {snap.title}
                </a>
                <button
                  type="button"
                  className="lens-copy"
                  onClick={() => void onCopy(snap.token)}
                >
                  {copied === snap.token ? "Copied" : "Copy link"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {session ? (
        <div className="rail-section lens-account">
          <span className="lens-email">{session.user.email}</span>
          <button type="button" className="lens-signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      ) : null}
    </nav>
  );
}
