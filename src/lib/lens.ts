// The Lens — deterministic search over the archive + a URL builder that
// preserves the other lens facets. Same philosophy as the Ghost Lens
// prototype and the footer's archive matcher: pure, client-safe, no LLM.
// Search is a token-overlap filter over a post's text; the order is then
// decided by the `sort` facet (newest / oldest), so a shared ?q=…&sort=…
// URL always reproduces the same slice.

import type { PostSummary, SortOrder } from "@/lib/engine/types";

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "is", "it", "that", "this", "what", "why", "how", "can", "do", "does", "did",
  "you", "we", "be", "as", "at", "by", "from", "my", "me", "about", "into",
  "not", "no", "are", "was", "were", "if", "so", "than", "then", "there",
  "here", "when", "which", "who", "your", "find", "show", "entries", "entry",
]);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP.has(t));
}

// The searchable text of a post summary — title, the intent layer, and topics.
function haystack(p: PostSummary): string {
  return [
    p.title,
    p.intent_label,
    p.intent_statement,
    p.central_question,
    p.core_insight,
    p.topics.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Filter posts by a free-text query. A post matches if it contains ANY of
 * the query's meaningful tokens (broad, forgiving recall for a small corpus).
 * Empty / stopword-only queries return the input unchanged.
 */
export function searchPosts(posts: PostSummary[], query: string): PostSummary[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return posts;
  return posts.filter((p) => {
    const hay = haystack(p);
    return tokens.some((t) => hay.includes(t));
  });
}

// --- URL state ------------------------------------------------------------
// The lens lives entirely in the query string so it works JS-off and a link
// reproduces the exact slice. Each control builds an href that keeps the
// OTHER facets intact.

export type LensParams = {
  q?: string;
  filter?: string;
  sort?: SortOrder;
};

export function archiveHref({ q, filter, sort }: LensParams): string {
  const sp = new URLSearchParams();
  if (q && q.trim()) sp.set("q", q.trim());
  if (filter) sp.set("filter", filter);
  if (sort && sort !== "newest") sp.set("sort", sort); // newest is the default
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}
