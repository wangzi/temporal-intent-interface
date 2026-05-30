// One entry row in the archive. Layer-1 (Title + Intent) per PRD §8.
//
// Semantic structure follows PRD §15:
//   <article aria-labelledby="entry-title-{post_id}">
//     <header>
//       <time datetime="...">…</time>
//       <h2 id="entry-title-…">
//         <a href="/post/{slug}">{title}</a>
//       </h2>
//       <button aria-label="…">{intent_label}</button>  ← Phase C: opens Local Constellation
//     </header>
//     <ScanDensity />
//   </article>
//
// Idle state per PRD §14: date · reading-time · title · intent label.
// Enriched state adds intent statement + core insight via <ScanDensity/>.
// On JS-off, the enriched block stays visible (graceful denser state).

import {
  formatAbsoluteDate,
  formatScanDate,
  readingTimeLabel,
  relativeAgo,
} from "@/lib/format";
import type { PostSummary } from "@/lib/engine/types";

import { ScanDensity } from "./ScanDensity";

export function TitleIntentLayer({
  post,
  now,
}: {
  post: PostSummary;
  /** Server-stable "now" timestamp (ms since epoch) used for the
   * relative-ago string. Pass the same value for every entry so the
   * relative strings are internally consistent within one SSR. */
  now: number;
}) {
  const headingId = `entry-title-${post.post_id}`;
  return (
    <article aria-labelledby={headingId}>
      <header>
        <div className="e-meta mono">
          <time
            dateTime={post.published_at}
            title={formatAbsoluteDate(post.published_at)}
          >
            {formatScanDate(post.published_at)}
          </time>
          <span className="dot-sep" aria-hidden="true">·</span>
          <span
            className="e-meta-ago"
            data-relative-from={post.published_at}
            suppressHydrationWarning
          >
            {relativeAgo(post.published_at, now)}
          </span>
          <span className="dot-sep" aria-hidden="true">·</span>
          <span>{readingTimeLabel(post.reading_time)}</span>
        </div>
        <button
          type="button"
          className="e-label mono"
          aria-label={`Open intent graph: ${post.intent_label}`}
          // Phase C: opens Local Constellation. In Phase B this is a
          // no-op visual affordance; the keyboard focus path is intact.
        >
          {post.intent_label}
        </button>
        <h2 className="e-title" id={headingId}>
          <a href={`/post/${post.slug}`}>{post.title}</a>
        </h2>
      </header>
      <ScanDensity post={post} />
    </article>
  );
}
