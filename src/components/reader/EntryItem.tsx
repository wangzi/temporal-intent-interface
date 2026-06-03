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
}: {
  post: PostSummary;
  /** Sequential position in the feed; drives `data-entry-index` (focus + the
   *  rail's search-hide threshold). Appended entries continue the SSR count. */
  index: number;
  /** Server-stable "now" (ms) for the relative-ago string. */
  now: number;
}) {
  return (
    <li
      className="entry"
      data-entry-index={index}
      data-year={postYear(post.published_at)}
      data-label={post.intent_label}
    >
      <TitleIntentLayer post={post} now={now} />
    </li>
  );
}
