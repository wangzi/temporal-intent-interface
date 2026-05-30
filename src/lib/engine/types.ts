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
