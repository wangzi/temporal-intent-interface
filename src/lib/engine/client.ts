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
  PostsListResponseSchema,
  PostDetailResponseSchema,
} from "./schemas";
import type {
  ListPostsParams,
  PostDetailResponse,
  PostsListResponse,
  PostSummary,
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
