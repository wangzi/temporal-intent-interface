// Client-side search + topic helpers for the Lens rail, over the SSR-rendered
// PostSummary set. Search is a non-destructive client filter (the rail hides
// non-matching entries); sort + topic stay URL-driven and server-rendered.

import type { PostSummary } from "@/lib/engine/types";

const STOP = new Set([
  "find", "show", "me", "the", "a", "an", "of", "from", "about", "to", "for",
  "and", "or", "in", "on", "with", "entries", "entry", "this", "that", "are",
  "is", "my", "our", "all", "any", "related",
]);

/** Distinct topics across the loaded posts, most frequent first. Empty today
 *  (journalkit hasn't populated post topics) → the rail shows only "All topics". */
export function topicsList(posts: PostSummary[]): string[] {
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.topics ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.keys()].sort(
    (a, b) => (counts.get(b)! - counts.get(a)!) || a.localeCompare(b),
  );
}

/** True if the post matches the free-text query (title + intent + insight +
 *  topics). Empty / stop-word-only query matches everything. */
export function matchPost(post: PostSummary, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const terms = q.split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
  if (!terms.length) return true;
  const hay = [
    post.title,
    post.intent_label,
    post.intent_statement,
    post.central_question,
    post.core_insight,
    ...(post.topics ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return terms.some((t) => hay.includes(t));
}
