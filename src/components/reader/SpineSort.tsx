// Sort toggle — one integrated control at the head of the spine: `Now ⇅ Past`
// (or `Past ⇅ Now` when reversed). The label shows the CURRENT top→bottom order;
// tapping the toggle flips it. A URL-driven <Link>, so it sorts JS-off and
// preserves the current query, topic selection, AND active Focus route, so a
// sort flip never drops the view.

import Link from "next/link";

import type { SortOrder } from "@/lib/engine/types";

// Build a "/" URL for a given sort, preserving q + topics + focus so the sort
// flip keeps the current search / topic / route view intact.
function sortHref(
  sort: SortOrder,
  query: string,
  topics: string[],
  focus: string | null,
): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (topics.length) params.set("topics", topics.join(","));
  if (focus) params.set("focus", focus);
  if (sort === "oldest") params.set("sort", "oldest");
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function SpineSort({
  currentSort,
  query,
  selectedTopics,
  activeRoute = null,
}: {
  currentSort: SortOrder;
  query: string;
  selectedTopics: string[];
  /** Active Focus route id, preserved across a sort flip (or null). */
  activeRoute?: string | null;
}) {
  const isNewest = currentSort === "newest";
  const next: SortOrder = isNewest ? "oldest" : "newest";
  // The leading endpoint is the current top of the feed; the trailing endpoint
  // is the bottom. Tapping flips to `next`.
  const leadLabel = isNewest ? "Now" : "Past";
  const trailLabel = isNewest ? "Past" : "Now";

  return (
    <nav className="spine-sort" aria-label="Sort order">
      <Link
        className="spine-sort-toggle"
        href={sortHref(next, query, selectedTopics, activeRoute)}
        aria-label={`Sorted ${
          isNewest ? "newest" : "oldest"
        } first. Switch to ${isNewest ? "oldest" : "newest"} first.`}
      >
        <span className="spine-sort-end">{leadLabel}</span>
        <span className="spine-sort-swap" aria-hidden="true">
          ⇅
        </span>
        <span className="spine-sort-end">{trailLabel}</span>
      </Link>
    </nav>
  );
}
