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
        {/* Intent label — a non-interactive marker until Phase C wires it to the
            Local Constellation. Rendered as a <span>, not a <button>: a styled,
            focusable control that does nothing on tap is a phantom target next
            to the real title link (mis-taps on touch) and is announced as a
            broken control by screen readers. Restore the <button> + min-height
            44px hit area when it actually opens something. */}
        <span className="e-label mono">{post.intent_label}</span>
        <h2 className="e-title" id={headingId}>
          <a href={`/post/${post.slug}`}>{post.title}</a>
        </h2>
      </header>
      <ScanDensity post={post} />
    </article>
  );
}
