// Deterministic, client-safe archive matcher for the "Ask the archive"
// footer experiment (lab). NO network, NO LLM — it scores fixture
// entries by token overlap against the intent layer and returns the
// matching entries WITH the reason they matched.
//
// This is the honest Phase-B prototype of the interaction. The real
// version (Phase C) replaces searchArchive() with a call to the
// engine's retrieval/synthesis endpoint, but the contract stays the
// same: a query in, ranked *navigable entries with a why* out — never
// generated prose, never a chatbot. (PRD: AI is summoned, never
// ambient; results are canonical entries, not impersonated text.)

import type { PostSummary } from "@/lib/engine/types";

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","is","it",
  "that","this","what","why","how","can","do","does","did","i","you","we","be",
  "as","at","by","from","my","me","about","into","not","no","are","was","were",
  "if","so","than","then","there","here","when","which","who","whom","your",
]);

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export type ArchiveMatch = {
  post: PostSummary;
  score: number;
  /** Human-readable, intent-aware reasons this entry matched. */
  reasons: string[];
};

// Field weights — the intent layer is weighted above the title/topics
// because matching on a *question* or *insight* is a deeper hit than a
// surface keyword. This is what makes the result feel intent-aware.
const FIELDS: {
  pick: (p: PostSummary) => string;
  weight: number;
  label: string;
}[] = [
  { pick: (p) => p.central_question, weight: 3, label: "shares a question" },
  { pick: (p) => p.intent_statement, weight: 2, label: "intent" },
  { pick: (p) => p.core_insight, weight: 2, label: "signal" },
  { pick: (p) => p.title, weight: 1.5, label: "title" },
  { pick: (p) => p.topics.join(" "), weight: 1, label: "topic" },
];

export function searchArchive(
  query: string,
  posts: PostSummary[],
  limit = 3,
): ArchiveMatch[] {
  const q = new Set(tokenize(query));
  if (q.size === 0) return [];

  const matches: ArchiveMatch[] = [];

  for (const post of posts) {
    let score = 0;
    const reasons: string[] = [];

    for (const field of FIELDS) {
      const hits = Array.from(
        new Set(tokenize(field.pick(post)).filter((t) => q.has(t))),
      );
      if (hits.length > 0) {
        score += hits.length * field.weight;
        reasons.push(`${field.label}: ${hits.join(", ")}`);
      }
    }

    if (score > 0) matches.push({ post, score, reasons });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}
