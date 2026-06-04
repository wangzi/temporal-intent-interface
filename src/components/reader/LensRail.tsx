"use client";

// LensRail — the reader's left control plane.
//
// SSR-preserving (JS-off hard rule): Sort + Topics are URL-driven <Link>s
// (?sort=, ?filter=); Search is a client-only, non-destructive hide over the
// SSR-rendered #feed entries. Those work without JS.
//
// Snapshot (JS-only, gated behind `mounted` so it's absent for JS-off): Google
// sign-in + "Snap this view" freeze the currently-visible entries (server
// sort/topic, minus client-hidden-by-search), in order, into a shareable
// /s/[token]. We show ONLY the link you just created (copy + ✕); each Snap
// replaces the previous one and there is NO history list — so the rail never
// gets busy. Supabase is lazy-loaded (getSupabase dynamic-imports it), so the
// auth client stays out of the reader's bundle until you sign in.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Session } from "@supabase/supabase-js";

import { createSnapshot, SnapshotError, type SnapshotMeta } from "@/lib/lens/api";
import { getSupabase } from "@/lib/lens/supabase";
import { matchPost } from "@/lib/lens/search";
import type { PostSummary, SortOrder } from "@/lib/engine/types";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

function originBase(): string {
  if (SITE) return SITE;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

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
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [snapLink, setSnapLink] = useState<SnapshotMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Search matches over the server-ordered set. Index = render order in #feed.
  const matches = useMemo(
    () =>
      posts
        .map((post, index) => ({ post, index }))
        .filter(({ post }) => matchPost(post, query)),
    [posts, query],
  );

  // Non-destructive search hide over the SSR entries (restored on unmount).
  useEffect(() => {
    const visible = new Set(matches.map((m) => m.index));
    document
      .querySelectorAll<HTMLElement>("#feed [data-entry-index]")
      .forEach((el) => {
        const idx = Number(el.getAttribute("data-entry-index"));
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

  // Snapshot UI is client-only (auth needs JS) → mount-gate it so JS-off shows
  // just search/sort/topics. Also: if we're returning from the Google OAuth
  // redirect (tokens in the URL hash), eagerly load Supabase to finish sign-in;
  // otherwise stay lazy.
  useEffect(() => {
    setMounted(true);
    if (
      typeof window !== "undefined" &&
      window.location.hash.includes("access_token")
    ) {
      void (async () => {
        try {
          const sb = await getSupabase();
          const { data } = await sb.auth.getSession();
          setSession(data.session);
        } catch {
          /* ignore — the user can click sign-in */
        }
      })();
    }
  }, []);

  const signIn = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const sb = await getSupabase();
      const { data } = await sb.auth.getSession();
      if (data.session) {
        setSession(data.session); // persisted session — no Google prompt
      } else {
        await sb.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              typeof window !== "undefined"
                ? window.location.origin
                : undefined,
          },
        }); // redirects away to Google
      }
    } catch {
      setError("Sign-in failed");
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const sb = await getSupabase();
      await sb.auth.signOut();
    } catch {
      /* ignore */
    } finally {
      setSession(null);
      setSnapLink(null);
    }
  }, []);

  const onSnap = useCallback(async () => {
    if (matches.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const sb = await getSupabase();
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setSession(null);
        setError("Please sign in again");
        return;
      }
      const snap = await createSnapshot(
        token,
        matches.map((m) => m.post.post_id),
        {
          topics: currentFilter ? [currentFilter] : [],
          sort: currentSort,
          query: query.trim(),
        },
      );
      setSnapLink(snap); // replaces any previous link — no history pile-up
      setCopied(false);
    } catch (e) {
      setError(
        e instanceof SnapshotError
          ? `Snapshot failed (${e.status})`
          : "Snapshot failed",
      );
    } finally {
      setBusy(false);
    }
  }, [matches, currentFilter, currentSort, query]);

  const onCopy = useCallback(async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${originBase()}/s/${token}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
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

      {mounted ? (
        <div className="rail-section">
          <h2>Snapshot</h2>
          {session ? (
            <>
              <button
                type="button"
                className="lens-snap"
                onClick={() => void onSnap()}
                disabled={busy || matches.length === 0}
              >
                {busy ? "Snapping…" : `Snap this view (${matches.length})`}
              </button>
              {snapLink ? (
                <div className="lens-snaplink">
                  <a
                    href={`/s/${snapLink.token}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {snapLink.title}
                  </a>
                  <div className="lens-snaplink-actions">
                    <button
                      type="button"
                      className="lens-copy"
                      onClick={() => void onCopy(snapLink.token)}
                    >
                      {copied ? "Copied" : "Copy link"}
                    </button>
                    <button
                      type="button"
                      className="lens-dismiss"
                      aria-label="Dismiss link"
                      onClick={() => setSnapLink(null)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : null}
              {error ? (
                <p className="lens-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                className="lens-signout"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="lens-signin"
                onClick={() => void signIn()}
                disabled={busy}
              >
                {busy ? "…" : "Sign in with Google to Snap"}
              </button>
              {error ? (
                <p className="lens-error" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </nav>
  );
}
