"use client";

// LensRail — the reader's left control plane. A two-column label → control
// panel (widens to ~700px on large displays; labels stack on narrow via a
// container query).
//
//   • Snap to share — JS-only, mount-gated. A corner-bracket icon + the count of
//     entries in view; signed out it starts Google sign-in, signed in it freezes
//     the rendered set (search results / focused route / feed, in order) into a
//     shareable /s/[token]. When a Focus route is active the descriptor also
//     carries { focus, route_label }. Supabase is lazy-loaded.
//   • Search — a GET form posting `?q=` (underline line, submits on Enter,
//     works JS-off). Hidden inputs carry the active focus route + sort so a
//     submit searches *within* the route and keeps the order.
//   • Focus — journalkit's navigation surface: selectable Routes grouped by
//     Category (GET /api/v1/focus). Single active route via `?focus=routeId`.
//   • Sort lives on the spine (see SpineSort).

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { Session } from "@supabase/supabase-js";

import { createSnapshot, SnapshotError, type SnapshotMeta } from "@/lib/lens/api";
import { getSupabase } from "@/lib/lens/supabase";
import type {
  FocusCategory,
  FocusResponse,
  FocusRoute,
  PostSummary,
  SortOrder,
} from "@/lib/engine/types";

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

// Build a "/" URL preserving q + sort, setting the focus route (empty = clear).
function focusHref({
  q,
  focus,
  sort,
}: {
  q: string;
  focus: string;
  sort: SortOrder;
}): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (focus) params.set("focus", focus);
  if (sort === "oldest") params.set("sort", "oldest");
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

// Categories in declared order.
function orderedCategories(focus: FocusResponse): FocusCategory[] {
  return [...focus.categories].sort((a, b) => a.order - b.order);
}

// A category's routes, in its declared route_ids order; falls back to a
// category_id match if route_ids is empty.
function routesForCategory(
  cat: FocusCategory,
  routes: FocusRoute[],
): FocusRoute[] {
  const byId = new Map(routes.map((r) => [r.route_id, r]));
  const ordered = cat.route_ids
    .map((id) => byId.get(id))
    .filter((r): r is FocusRoute => Boolean(r));
  if (ordered.length) return ordered;
  return routes
    .filter((r) => r.category_id === cat.category_id)
    .sort((a, b) => a.order - b.order);
}

export function LensRail({
  posts,
  focus,
  activeRoute,
  query,
  currentSort,
}: {
  /** The currently-rendered set, in order — what Snap freezes (route entries,
   *  search results, or the feed). Also the Snap count. */
  posts: PostSummary[];
  /** GET /api/v1/focus — the focus index (categories + routes). */
  focus: FocusResponse;
  /** Active route id from `?focus=`, or null. Single-select. */
  activeRoute: string | null;
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

  const count = posts.length;
  const activeRouteLabel = activeRoute
    ? (focus.routes.find((r) => r.route_id === activeRoute)?.label ?? null)
    : null;

  // Snapshot UI is client-only (auth needs JS) → mount-gate it so JS-off shows
  // just search + focus. Resume an in-flight OAuth redirect from the URL hash.
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
      // Freeze the rendered set in order — focused route entries, search
      // results, or the feed. Carry the focus route in the descriptor.
      const snap = await createSnapshot(
        token,
        posts.map((p) => p.post_id),
        {
          topics: [],
          sort: currentSort,
          query: query.trim(),
          ...(activeRoute
            ? { focus: activeRoute, route_label: activeRouteLabel ?? activeRoute }
            : {}),
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
  }, [posts, currentSort, query, activeRoute, activeRouteLabel]);

  const onCopy = useCallback(async (token: string) => {
    try {
      await navigator.clipboard.writeText(`${originBase()}/s/${token}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the link is still openable */
    }
  }, []);

  const categories = orderedCategories(focus);

  return (
    <nav className="rail" id="reader-rail" aria-label="Reader navigation">
      <span className="brand">
        z<b>.</b>
      </span>

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
              autoComplete="off"
            />
            {activeRoute ? (
              <input type="hidden" name="focus" value={activeRoute} readOnly />
            ) : null}
            {currentSort === "oldest" ? (
              <input type="hidden" name="sort" value="oldest" readOnly />
            ) : null}
            {/* No submit button — a single search field submits on Enter. */}
          </form>
          {query ? (
            <Link
              className="lens-search-clear"
              href={focusHref({
                q: "",
                focus: activeRoute ?? "",
                sort: currentSort,
              })}
            >
              Clear search
            </Link>
          ) : null}
        </div>
      </div>

      {/* Snap to share — JS-only (mount-gated). Icon + count. */}
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
        <h2>Focus</h2>
        <div className="rail-control rail-focus">
          <Link
            className={`topic-opt${!activeRoute ? " on" : ""}`}
            href={focusHref({ q: query, focus: "", sort: currentSort })}
            aria-current={!activeRoute ? "true" : undefined}
          >
            <span className="topic-radio" aria-hidden="true" />
            <span className="topic-name">All</span>
          </Link>
          {categories.length === 0 ? (
            <p className="rail-empty">No routes yet.</p>
          ) : (
            categories.map((cat) => {
              const routes = routesForCategory(cat, focus.routes);
              if (routes.length === 0) return null;
              return (
                <div key={cat.category_id} className="focus-group">
                  <h3 className="focus-cat">{cat.label}</h3>
                  {routes.map((route) => {
                    const on = route.route_id === activeRoute;
                    return (
                      <Link
                        key={route.route_id}
                        className={`topic-opt${on ? " on" : ""}`}
                        href={focusHref({
                          q: query,
                          focus: route.route_id,
                          sort: currentSort,
                        })}
                        aria-current={on ? "true" : undefined}
                      >
                        <span className="topic-radio" aria-hidden="true" />
                        <span className="topic-name">{route.label}</span>
                        <span className="topic-count">{route.entry_count}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </nav>
  );
}
