// Shared derivations for the footer layout experiments. Pure functions
// over the §9 PostSummary set — no network, no state. Used by all three
// layout variants so the *content* is held constant and only the
// typographic composition differs between them.

import type { PostSummary } from "@/lib/engine/types";

export type CorpusStats = {
  count: number;
  oldest: string | null;
  newest: string | null;
  minutes: number;
  startYear: string | null;
};

export function corpusStats(posts: PostSummary[]): CorpusStats {
  const dates = posts.map((p) => p.published_at).sort();
  const oldest = dates[0] ?? null;
  const newest = dates[dates.length - 1] ?? null;
  const minutes = posts.reduce((sum, p) => sum + (p.reading_time || 0), 0);
  return {
    count: posts.length,
    oldest,
    newest,
    minutes,
    startYear: oldest ? new Date(oldest).getUTCFullYear().toString() : null,
  };
}

export type Thread = {
  question: string;
  slug: string;
  label: string;
  title: string;
};

/** Every entry's authored central_question, deduped, first-seen order. */
export function uniqueThreads(posts: PostSummary[]): Thread[] {
  const seen = new Set<string>();
  const out: Thread[] = [];
  for (const p of posts) {
    const q = p.central_question?.trim();
    if (!q || seen.has(q)) continue;
    seen.add(q);
    out.push({ question: q, slug: p.slug, label: p.intent_label, title: p.title });
  }
  return out;
}

/** Lowercase the first letter — for weaving questions into running prose. */
export function uncapitalize(s: string): string {
  return s.length > 0 ? s[0]!.toLowerCase() + s.slice(1) : s;
}

/** Strip a trailing "?" so a question can sit mid-sentence as a clause. */
export function asClause(question: string): string {
  return uncapitalize(question.replace(/\?+\s*$/, ""));
}
