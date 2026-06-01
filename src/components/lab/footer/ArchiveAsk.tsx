"use client";

// Variant-aware "Ask the archive" island, shared by all three footer
// layouts so the function is identical and only the type treatment
// differs. Deterministic client-side matching over the corpus (see
// lib/lab/archive-search.ts) — no network, no LLM (Phase-C swaps the
// matcher for the engine endpoint; same contract). Respects "AI is
// summoned, never ambient": nothing fires until the reader asks.

import { useState } from "react";

import { searchArchive, type ArchiveMatch } from "@/lib/lab/archive-search";
import type { PostSummary } from "@/lib/engine/types";

type Variant = "column" | "index" | "spine";

const PLACEHOLDER: Record<Variant, string> = {
  column: "ask the journal anything",
  index: "ask…",
  spine: "ask the archive",
};

export function ArchiveAsk({
  posts,
  variant,
}: {
  posts: PostSummary[];
  variant: Variant;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<ArchiveMatch[] | null>(null);

  function run(e: React.FormEvent): void {
    e.preventDefault();
    const q = query.trim();
    setMatches(q.length === 0 ? null : searchArchive(q, posts));
  }

  return (
    <div className={`lf-ask lf-ask--${variant}`}>
      <form className="lf-ask-form" onSubmit={run} role="search">
        <span className="lf-ask-caret" aria-hidden="true">
          ▸
        </span>
        <input
          type="text"
          className="lf-ask-input"
          placeholder={PLACEHOLDER[variant]}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Ask this journal anything"
        />
      </form>

      {matches !== null && (
        <div className="lf-ask-results" aria-live="polite">
          {matches.length === 0 ? (
            <p className="lf-ask-empty">Nothing cleared the bar. Try other words.</p>
          ) : (
            <ol className="lf-ask-list">
              {matches.map((m) => (
                <li key={m.post.post_id}>
                  <a href={`/post/${m.post.slug}`} className="lf-ask-hit">
                    <span className="lf-ask-title" data-text-origin="canonical">
                      {m.post.title}
                    </span>
                    <span className="lf-ask-why">{m.reasons.join("  ·  ")}</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
