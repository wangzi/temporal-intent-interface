// PRD §9 — Engine ↔ reader API contract types.
// Single source of truth for engine response shapes. All callers
// (page routes, BFF route handlers, components) import from here.

export type Author = {
  id: string;
  display_name: string;
};

export type PostMedia = {
  type: "image" | "video";
  src: string;
  alt?: string;
};

export type PostVideoLink = {
  provider: string;
  id: string;
  embed_url: string;
};

/** Returned by GET /api/v1/posts entries. */
export type PostSummary = {
  post_id: string;
  slug: string;
  title: string;
  /** ISO 8601 timestamp */
  published_at: string;
  /** Minutes. Formatted client-side via lib/format.ts. */
  reading_time: number;
  authors: Author[];
  intent_label: string;
  intent_statement: string;
  central_question: string;
  core_insight: string;
  core_insight_visible: boolean;
  topics: string[];
  /** ISO 8601 timestamp or null. When set and in the future, the post pins. */
  pinned_until: string | null;
};

/** Returned by GET /api/v1/posts/{slug}. */
export type PostDetail = PostSummary & {
  /** Sanitized HTML from the engine (PRD §9 D16). TII does NOT re-sanitize. */
  body_html: string;
  media: PostMedia[];
  video_link: PostVideoLink | null;
  updated_at: string;
};

export type PostsListResponse = {
  posts: PostSummary[];
  next_cursor: string | null;
};

export type PostDetailResponse = {
  post: PostDetail;
};

export type SortOrder = "newest" | "oldest";

export type ListPostsParams = {
  sort?: SortOrder;
  cursor?: string;
  /** Intent-label filter, e.g. "Humanity & Technology". */
  filter?: string;
};

/** Match metadata journalkit attaches to each search result (engine §search). */
export type SearchHit = {
  /** Relevance score; higher = better. Result order already reflects it. */
  score: number;
  /** Which fields matched, e.g. ["title", "body"] or ["topics"]. */
  fields: string[];
  /** A short excerpt around the match, ready to render. */
  snippet: string;
};

/** One entry from GET /api/v1/search — a PostSummary plus its match metadata. */
export type SearchResult = PostSummary & {
  search: SearchHit;
};

/** Returned by GET /api/v1/search?q=&topics=. Results are in relevance order. */
export type SearchResponse = {
  results: SearchResult[];
};

/** One topic facet with the count of posts carrying it. */
export type TopicFacet = {
  topic: string;
  count: number;
};

/** Returned by GET /api/v1/topics. Sorted by count desc, then label asc. */
export type TopicsResponse = {
  topics: TopicFacet[];
};

export type SearchParams = {
  /** Free-text query. Body-aware on the engine. Omit for a topic-only filter. */
  q?: string;
  /** OR-semantics topic filter. */
  topics?: string[];
  /** Focus route ids to restrict the search to (GET /api/v1/search?focus=). */
  focus?: string[];
  limit?: number;
  sort?: SortOrder;
};

// ── Focus API — journalkit's navigation surface ─────────────────────────────
// Focus groups the journal into selectable Routes, grouped by Category
// (AI / Healthspan / Startup / Macro). NOT "topics", "TOC", or "index" in the UI.

/** A category grouping a set of routes (GET /api/v1/focus). */
export type FocusCategory = {
  category_id: string;
  label: string;
  order: number;
  /** Ordered route ids belonging to this category. */
  route_ids: string[];
};

/** A selectable route (a curated path through the journal). */
export type FocusRoute = {
  route_id: string;
  label: string;
  category_id: string;
  order: number;
  description: string;
  aliases: string[];
  tags: string[];
  /** Number of entries mapped to this route. */
  entry_count: number;
};

/** GET /api/v1/focus — the focus index: categories + their routes. */
export type FocusResponse = {
  categories: FocusCategory[];
  routes: FocusRoute[];
};

/** Route metadata returned alongside a route's entries (the body header). */
export type FocusRouteMeta = {
  route_id: string;
  label: string;
  category_id: string;
  description: string;
  aliases: string[];
  tags: string[];
  entry_count: number;
};

/** One curated entry→route mapping. `reason` = why this entry belongs here. */
export type FocusMapping = {
  /** journalkit post_id of the mapped entry. */
  entry_id: string;
  /** Day marker, e.g. "90" (for "Day 90 — …"). May be empty. */
  day: string;
  /** The mapping reason — do NOT drop this in the UI. */
  reason: string;
  slug: string;
};

/** GET /api/v1/focus/:routeId/entries — route header + mapped entries. */
export type FocusRouteResponse = {
  route: FocusRouteMeta;
  /** Curated mappings (in order); carries the per-entry reason. */
  mappings: FocusMapping[];
  /** The mapped entries as PostSummaries (deduped, in curated order). */
  entries: PostSummary[];
};
