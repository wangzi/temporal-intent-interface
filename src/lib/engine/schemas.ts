// Zod schemas mirroring src/lib/engine/types.ts.
// Runtime guard at the BFF boundary: catches engine contract drift
// loudly instead of letting a missing field silently undefine
// downstream UI. Used inside src/lib/engine/client.ts only.

import { z } from "zod";

export const AuthorSchema = z.object({
  id: z.string(),
  display_name: z.string(),
});

export const PostMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  src: z.string(),
  alt: z.string().optional(),
});

export const PostVideoLinkSchema = z.object({
  provider: z.string(),
  id: z.string(),
  embed_url: z.string(),
});

export const PostSummarySchema = z.object({
  post_id: z.string(),
  slug: z.string(),
  title: z.string(),
  published_at: z.string(),
  reading_time: z.number(),
  authors: z.array(AuthorSchema),
  intent_label: z.string(),
  intent_statement: z.string(),
  central_question: z.string(),
  core_insight: z.string(),
  core_insight_visible: z.boolean(),
  topics: z.array(z.string()),
  pinned_until: z.string().nullable(),
});

export const PostDetailSchema = PostSummarySchema.extend({
  body_html: z.string(),
  media: z.array(PostMediaSchema),
  video_link: PostVideoLinkSchema.nullable(),
  updated_at: z.string(),
});

export const PostsListResponseSchema = z.object({
  posts: z.array(PostSummarySchema),
  next_cursor: z.string().nullable(),
});

export const PostDetailResponseSchema = z.object({
  post: PostDetailSchema,
});

export const SearchHitSchema = z.object({
  score: z.number(),
  fields: z.array(z.string()),
  snippet: z.string(),
});

export const SearchResultSchema = PostSummarySchema.extend({
  search: SearchHitSchema,
});

export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
});

export const TopicFacetSchema = z.object({
  topic: z.string(),
  count: z.number(),
});

export const TopicsResponseSchema = z.object({
  topics: z.array(TopicFacetSchema),
});
