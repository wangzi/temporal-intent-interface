import "server-only";

// Engine BFF — the single trust boundary for journalkit API access.
// `import "server-only"` makes this module unimportable from any
// client component; the bundler will fail build if attempted. The
// JOURNALKIT_API_KEY never leaves this module's call frame.
//
// PRD §9 D16: the engine returns sanitized HTML for post bodies.
// TII does NOT re-sanitize. CanonicalBody renders body_html via
// dangerouslySetInnerHTML; the engine sanitization is the seam.

import { env } from "@/lib/env";
import { fixtureGet } from "./fixtures";
import {
  FocusResponseSchema,
  FocusRouteResponseSchema,
  PostsListResponseSchema,
  PostDetailResponseSchema,
  SearchResponseSchema,
} from "./schemas";
import type {
  FocusResponse,
  FocusRouteResponse,
  ListPostsParams,
  PostDetailResponse,
  PostsListResponse,
  PostSummary,
  SearchParams,
  SearchResponse,
  SearchResult,
} from "./types";

export class EngineError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

export class EngineNotFoundError extends EngineError {
  constructor(message = "not_found") {
    super(message, 404);
    this.name = "EngineNotFoundError";
  }
}

async function fetchJSON(path: string): Promise<unknown> {
  const url = `${env.JOURNALKIT_API_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: env.JOURNALKIT_API_KEY
        ? `Bearer ${env.JOURNALKIT_API_KEY}`
        : "",
      Accept: "application/json",
    },
    // ISR/revalidate happens at the page-route level (see route segment
    // config). The fetch itself is uncached so a hot retry hits the engine.
    cache: "no-store",
  });
  if (response.status === 404) {
    throw new EngineNotFoundError();
  }
  if (!response.ok) {
    throw new EngineError(
      `engine HTTP ${response.status} for ${path}`,
      response.status,
    );
  }
  return (await response.json()) as unknown;
}

/** GET /api/v1/posts */
export async function listPosts(
  params: ListPostsParams = {},
): Promise<PostsListResponse> {
  if (env.JOURNALKIT_FIXTURE_MODE) {
    const raw = await fixtureGet("posts");
    if (!raw) throw new EngineError("fixture posts.json missing", 500);
    const validated = PostsListResponseSchema.parse(raw);
    return applyListParams(validated, params);
  }

  const q = new URLSearchParams();
  if (params.sort) q.set("sort", params.sort);
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.filter) q.set("filter", params.filter);
  const path = `/posts${q.toString() ? `?${q.toString()}` : ""}`;
  const raw = await fetchJSON(path);
  return PostsListResponseSchema.parse(raw);
}

/** GET /api/v1/posts/{slug}. Throws EngineNotFoundError on miss. */
export async function getPost(slug: string): Promise<PostDetailResponse> {
  if (env.JOURNALKIT_FIXTURE_MODE) {
    const raw = await fixtureGet(`post-${slug}`);
    if (!raw) throw new EngineNotFoundError(`fixture post-${slug}.json missing`);
    return PostDetailResponseSchema.parse(raw);
  }

  const raw = await fetchJSON(`/posts/${encodeURIComponent(slug)}`);
  return PostDetailResponseSchema.parse(raw);
}

/**
 * GET /api/v1/search?q=&topics=&limit= — body-aware text search + OR-semantics
 * topic filter. Results arrive in relevance order, each with a ready-to-render
 * snippet. Empty q AND empty topics short-circuits to no results (matching the
 * engine). Fixture mode approximates over the summary fields (no body_md offline).
 */
export async function searchPosts(
  params: SearchParams = {},
): Promise<SearchResponse> {
  const q = (params.q ?? "").trim();
  const topics = (params.topics ?? []).map((t) => t.trim()).filter(Boolean);
  const focus = (params.focus ?? []).map((f) => f.trim()).filter(Boolean);
  if (!q && topics.length === 0 && focus.length === 0) return { results: [] };

  if (env.JOURNALKIT_FIXTURE_MODE) {
    const raw = await fixtureGet("posts");
    if (!raw) throw new EngineError("fixture posts.json missing", 500);
    const { posts } = PostsListResponseSchema.parse(raw);
    // Offline approximation can't resolve focus mappings; search over summaries.
    return { results: fixtureSearch(posts, q, topics, params.limit ?? 50) };
  }

  const sp = new URLSearchParams();
  if (q) sp.set("q", q);
  if (topics.length) sp.set("topics", topics.join(","));
  if (focus.length) sp.set("focus", focus.join(","));
  if (params.limit) sp.set("limit", String(params.limit));
  const raw = await fetchJSON(`/search?${sp.toString()}`);
  return SearchResponseSchema.parse(raw);
}

/** GET /api/v1/focus — the Focus index: categories and their routes. */
export async function listFocus(): Promise<FocusResponse> {
  if (env.JOURNALKIT_FIXTURE_MODE) {
    const raw = await fixtureGet("focus");
    // No fixture offline → empty index (rail renders its empty state). Real
    // Focus data comes from the keyed engine in prod.
    if (!raw) return { categories: [], routes: [] };
    return FocusResponseSchema.parse(raw);
  }
  const raw = await fetchJSON("/focus");
  return FocusResponseSchema.parse(raw);
}

/**
 * GET /api/v1/focus/{routeId}/entries — a route's header metadata, its curated
 * mappings (each with the `reason` an entry belongs here), and the mapped
 * entries as PostSummaries (in curated order). Throws EngineNotFoundError on an
 * unknown route.
 */
export async function getFocusRoute(
  routeId: string,
): Promise<FocusRouteResponse> {
  if (env.JOURNALKIT_FIXTURE_MODE) {
    const raw = await fixtureGet(`focus-${routeId}`);
    if (!raw) {
      throw new EngineNotFoundError(`fixture focus-${routeId}.json missing`);
    }
    return FocusRouteResponseSchema.parse(raw);
  }
  const raw = await fetchJSON(
    `/focus/${encodeURIComponent(routeId)}/entries`,
  );
  return FocusRouteResponseSchema.parse(raw);
}

// In-process sort + filter for the fixture path. The real engine is
// expected to do this server-side, so this code is only exercised in
// fixture mode (JOURNALKIT_FIXTURE_MODE=true).
function applyListParams(
  response: PostsListResponse,
  params: ListPostsParams,
): PostsListResponse {
  let posts: PostSummary[] = [...response.posts];

  if (params.filter) {
    posts = posts.filter((p) => p.intent_label === params.filter);
  }

  // Pinned posts float above the sort order. (Open question for the
  // engine: should the real API do this, or return pinned separately?)
  const pinned: PostSummary[] = [];
  const rest: PostSummary[] = [];
  const now = new Date().toISOString();
  for (const p of posts) {
    if (p.pinned_until && p.pinned_until > now) {
      pinned.push(p);
    } else {
      rest.push(p);
    }
  }

  rest.sort((a, b) => {
    const cmp = a.published_at.localeCompare(b.published_at);
    return params.sort === "oldest" ? cmp : -cmp;
  });

  return { posts: [...pinned, ...rest], next_cursor: null };
}

// Fixture-only search — offline approximation over the summary fields (fixtures
// carry no body_md). Real, body-aware search runs on the engine.
function fixtureSearch(
  posts: PostSummary[],
  q: string,
  topics: string[],
  limit: number,
): SearchResult[] {
  const ql = q.toLowerCase();
  const wanted = topics.map((t) => t.toLowerCase());
  const out: SearchResult[] = [];
  for (const p of posts) {
    const ptopics = (p.topics ?? []).map((t) => t.toLowerCase());
    if (wanted.length && !wanted.some((t) => ptopics.includes(t))) continue;
    const hay = [
      p.title,
      p.intent_label,
      p.intent_statement,
      p.central_question,
      p.core_insight_visible ? p.core_insight : "",
      ...(p.topics ?? []),
    ]
      .join(" ")
      .toLowerCase();
    if (ql && !hay.includes(ql)) continue;
    out.push({
      ...p,
      search: {
        score: 1,
        fields: ["fixture"],
        snippet: (p.intent_statement || p.core_insight || p.title).slice(0, 200),
      },
    });
  }
  return out.slice(0, limit);
}
