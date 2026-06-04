"use client";

// LensRail — the reader's left control plane. A two-column label → control
// panel (widens to ~700px on large displays; labels stack above their control
// on narrow screens via a container query).
//
//   • Snap to share — JS-only, mount-gated (absent for JS-off). One control: a
//     corner-bracket icon + the count of entries in view. Signed out it starts
//     Google sign-in; signed in it freezes the rendered set (search results in
//     order, or the feed) into a shareable /s/[token]. We show ONLY the link you
//     just made (copy + ✕); each Snap replaces the previous — no history.
//     Supabase is lazy-loaded (getSupabase) so auth stays out of the bundle
//     until you sign in.
//   • Search — a GET form posting `?q=` (an underline line that submits on
//     Enter, works JS-off). journalkit does the body-aware match server-side;
//     page.tsx renders results. Hidden inputs carry topics + sort so a submit
//     never drops them.
//   • Topics — real facets from journalkit /api/v1/topics: radio-style rows
//     (○ / ●) with counts. Multi-select OR — each toggles itself in
//     `?topics=a,b`; several can be active at once.
//   • Sort lives on the spine now (see SpineSort); the rail only threads the
//     current `?sort=` through its search + topic links.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { Session } from "@supabase/supabase-js";

import { createSnapshot, SnapshotError, type SnapshotMeta } from "@/lib/lens/api";
import { getSupabase } from "@/lib/lens/supabase";
import type { PostSummary, SortOrder, TopicFacet } from "@/lib/engine/types";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

function originBase(): string {
  if (SITE) return SITE;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

// Corner-bracket "snap / capture" mark for the Snap-to-share control.
function SnapIcon() {
  return (
    <svg
      className="snap-icon"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 6V3a2 2 0 0 1 2-2h3M12 1h3a2 2 0 0 1 2 2v3M17 12v3a2 2 0 0 1-2 2h-3M6 17H3a2 2 0 0 1-2-2v-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

type RailState = { q: string; topics: string[]; sort: SortOrder };

// Build a "/" URL from the full rail state — the same `?q` / `?topics` / `?sort`
// contract page.tsx reads. Empty values are omitted so the canonical feed is "/".
function railHref({ q, topics, sort }: RailState): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (topics.length) params.set("topics", topics.join(","));
  if (sort === "oldest") params.set("sort", "oldest");
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

// Add or remove a topic (case-insensitive) — OR-semantics multi-select.
function toggleTopic(selected: string[], topic: string): string[] {
  const key = topic.toLowerCase();
  return selected.some((t) => t.toLowerCase() === key)
    ? selected.filter((t) => t.toLowerCase() !== key)
    : [...selected, topic];
}

export function LensRail({
  posts,
  facets,
  selectedTopics,
  query,
  currentSort,
}: {
  /** The currently-rendered set, in order — what Snap freezes (the search
   *  results in search mode, the feed otherwise). Also the "All topics" /
   *  Snap count. */
  posts: PostSummary[];
  /** Real topic facets from journalkit /api/v1/topics (topic + post count). */
  facets: TopicFacet[];
  /** Currently selected topics (from `?topics=`), OR-combined. */
  selectedTopics: string[];
  /** Current free-text query (from `?q=`). */
  query: string;
  currentSort: SortOrder;
}) {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [snapLink, setSnapLink] = useState<SnapshotMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedSet = new Set(selectedTopics.map((t) => t.toLowerCase()));
  const noTopics = selectedTopics.length === 0;
  const count = posts.length;

  // Snapshot UI is client-only (auth needs JS) → mount-gate it so JS-off shows
  // just search + topics. Also: if we're returning from the Google OAuth
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
    if (posts.length === 0) return;
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
      // Freeze the rendered set in order — search results in result order, or
      // the current feed.
      const snap = await createSnapshot(
        token,
        posts.map((p) => p.post_id),
        {
          topics: selectedTopics,
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
  }, [posts, selectedTopics, currentSort, query]);

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

      {/* Snap to share — JS-only (mount-gated). One affordance: icon + count.
          Signed out → starts Google sign-in; signed in → snaps. */}
      {mounted ? (
        <div className="rail-section">
          <h2>Snap to share</h2>
          <div className="rail-control">
            <button
              type="button"
              className="lens-snap"
              onClick={() => void (session ? onSnap() : signIn())}
              disabled={busy || (!!session && count === 0)}
              aria-label={
                session
                  ? `Snap ${count} ${count === 1 ? "entry" : "entries"} to a shareable link`
                  : "Sign in with Google to snap and share"
              }
              title={
                session
                  ? "Snap this view to a shareable link"
                  : "Sign in with Google to snap"
              }
            >
              <SnapIcon />
              <span className="lens-snap-count">{busy ? "…" : count}</span>
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
            {session ? (
              <button
                type="button"
                className="lens-signout"
                onClick={() => void signOut()}
              >
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rail-section">
        <h2>Search</h2>
        <div className="rail-control">
          <form
            className="lens-search-form"
            method="get"
            action="/"
            role="search"
          >
            <input
              className="lens-search"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search title, body, intent…"
              aria-label="Search entries"
              // name="q" is a very common form-field name, so browsers offer
              // cross-site autofill history here — suppress it.
              autoComplete="off"
            />
            {selectedTopics.length > 0 ? (
              <input
                type="hidden"
                name="topics"
                value={selectedTopics.join(",")}
                readOnly
              />
            ) : null}
            {currentSort === "oldest" ? (
              <input type="hidden" name="sort" value="oldest" readOnly />
            ) : null}
            {/* No submit button — a single search field submits on Enter (works
                JS-off too). The input is a simple line, not a box. */}
          </form>
          {query ? (
            <Link
              className="lens-search-clear"
              href={railHref({ q: "", topics: selectedTopics, sort: currentSort })}
            >
              Clear search
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rail-section">
        <h2>Topics</h2>
        <div className="rail-control rail-topics">
          <Link
            className={`topic-opt${noTopics ? " on" : ""}`}
            href={railHref({ q: query, topics: [], sort: currentSort })}
            aria-current={noTopics ? "true" : undefined}
          >
            <span className="topic-radio" aria-hidden="true" />
            <span className="topic-name">All topics</span>
            <span className="topic-count">{count}</span>
          </Link>
          {facets.length === 0 ? (
            <p className="rail-empty">No topics yet.</p>
          ) : (
            facets.map((f) => {
              const on = selectedSet.has(f.topic.toLowerCase());
              return (
                <Link
                  key={f.topic}
                  className={`topic-opt${on ? " on" : ""}`}
                  href={railHref({
                    q: query,
                    topics: toggleTopic(selectedTopics, f.topic),
                    sort: currentSort,
                  })}
                  aria-current={on ? "true" : undefined}
                >
                  <span className="topic-radio" aria-hidden="true" />
                  <span className="topic-name">{f.topic}</span>
                  <span className="topic-count">{f.count}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </nav>
  );
}
