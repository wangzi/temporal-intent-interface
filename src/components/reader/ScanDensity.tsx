// Layer-1 enriched-state content for an entry: Intent statement +
// Key insight. Pure server markup.
//
// PROGRESSIVE-ENHANCEMENT NOTE (PRD §17.4 + plan §5):
// The .enrich element ships fully visible (opacity 1) so JS-off readers
// see the full content density. On JS, ReaderControlsIsland fades each
// entry's .enrich by its distance to the focus line — opacity only, so
// the reveal never reflows the page (see that file for the rationale).

import type { PostSummary } from "@/lib/engine/types";

export function ScanDensity({
  post,
}: {
  post: Pick<PostSummary, "intent_statement" | "core_insight" | "core_insight_visible">;
}) {
  return (
    <div className="enrich">
      <span className="k">Intent</span>
      <p className="statement" data-text-origin="canonical">
        {post.intent_statement}
      </p>
      {post.core_insight_visible ? (
        <>
          <span className="k">Key insight</span>
          <p className="insight" data-text-origin="canonical">
            {post.core_insight}
          </p>
        </>
      ) : null}
    </div>
  );
}
