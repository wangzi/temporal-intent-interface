// Shared archive entry row.
//
// NO "use client" directive on purpose: this is a *shared* component. Inside the
// SSR feed (page.tsx) it renders as a Server Component (no hydration cost for the
// first page); inside the Load-more island it renders as a Client Component. One
// definition → the appended entries are byte-identical to the SSR ones, so there
// is no visual seam. It depends only on pure modules (format, TitleIntentLayer,
// ScanDensity), which is what makes it safe in both trees.

import { postYear } from "@/lib/format";
import type { PostSummary } from "@/lib/engine/types";

import { TitleIntentLayer } from "./TitleIntentLayer";

export function EntryItem({
  post,
  index,
  now,
  snippet,
  reason,
}: {
  post: PostSummary;
  /** Sequential position in the feed; drives `data-entry-index` (focus + the
   *  rail's search-hide threshold). Appended entries continue the SSR count. */
  index: number;
  /** Server-stable "now" (ms) for the relative-ago string. */
  now: number;
  /** Search-result excerpt from the engine (match evidence). Rendered below the
   *  title in search mode; omitted in the default feed. */
  snippet?: string;
  /** Focus route mapping reason — "why this entry belongs to this route."
   *  Visually distinct from the search snippet; both can show at once. */
  reason?: string;
}) {
  return (
    <li
      className="entry"
      data-entry-index={index}
      data-year={postYear(post.published_at)}
      data-label={post.intent_label}
    >
      <TitleIntentLayer post={post} now={now} />
      {snippet ? <p className="e-snippet">{snippet}</p> : null}
      {reason ? (
        <div className="e-reason">
          <span className="e-reason-label">Why this entry belongs here</span>
          <p className="e-reason-text">{reason}</p>
        </div>
      ) : null}
    </li>
  );
}
