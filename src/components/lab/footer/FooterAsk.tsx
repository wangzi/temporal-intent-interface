"use client";

// Experiment 3 — "Ask the archive".
//
// The headline AI-era move: replace social links with one quiet input —
// "Ask this journal anything." It returns REAL ENTRIES, ranked, each
// with the *why* it matched (drawn from the intent layer), never a
// chatbot paragraph. The journal becomes queryable as a body of thought.
//
// Phase-B honesty: matching is client-side + deterministic over the
// corpus (see lib/lab/archive-search.ts) — no network, no LLM yet. The
// Phase-C version swaps the matcher for the engine's retrieval endpoint;
// the interaction contract (query in → navigable entries + why out)
// stays identical. Respects "AI is summoned, never ambient": nothing
// happens until the reader asks.

import { useState } from "react";

import { searchArchive, type ArchiveMatch } from "@/lib/lab/archive-search";
import type { PostSummary } from "@/lib/engine/types";

type State =
  | { kind: "idle" }
  | { kind: "results"; query: string; matches: ArchiveMatch[] };

export function FooterAsk({ posts }: { posts: PostSummary[] }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  function run(e: React.FormEvent): void {
    e.preventDefault();
    const q = query.trim();
    if (q.length === 0) {
      setState({ kind: "idle" });
      return;
    }
    setState({ kind: "results", query: q, matches: searchArchive(q, posts) });
  }

  return (
    <section className="labf labf-ask" aria-label="Ask the archive">
      <p className="labf-kicker mono">Ask this journal</p>
      <form className="labf-ask-form" onSubmit={run} role="search">
        <input
          type="text"
          className="labf-ask-input mono"
          placeholder="what have you figured out about attention?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Ask this journal anything"
        />
        <button type="submit" className="labf-ask-go mono" aria-label="Ask">
          →
        </button>
      </form>

      {state.kind === "results" && (
        <div className="labf-ask-results" aria-live="polite">
          {state.matches.length === 0 ? (
            <p className="labf-ask-empty mono">
              Nothing in the archive cleared the bar for “{state.query}”. Try
              different words.
            </p>
          ) : (
            <ol className="labf-ask-list">
              {state.matches.map((m) => (
                <li key={m.post.post_id}>
                  <a href={`/post/${m.post.slug}`} className="labf-ask-hit">
                    <span
                      className="labf-ask-title"
                      data-text-origin="canonical"
                    >
                      {m.post.title}
                    </span>
                    <span className="labf-ask-why mono">
                      {m.reasons.join("  ·  ")}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
