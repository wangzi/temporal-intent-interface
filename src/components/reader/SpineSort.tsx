// Sort control, integrated into the spine as a small node at the head of the
// timeline. Two direction links — Now → Past (newest) / Past → Now (oldest) —
// that preserve the current query, topic selection, AND active Focus route, so a
// sort flip never drops the view. URL-driven <Link>s, so it sorts JS-off.

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
  return (
    <nav className="spine-sort" aria-label="Sort order">
      <Link
        className={`spine-sort-opt${currentSort === "newest" ? " on" : ""}`}
        href={sortHref("newest", query, selectedTopics, activeRoute)}
        aria-current={currentSort === "newest" ? "true" : undefined}
      >
        Now → Past
      </Link>
      <Link
        className={`spine-sort-opt${currentSort === "oldest" ? " on" : ""}`}
        href={sortHref("oldest", query, selectedTopics, activeRoute)}
        aria-current={currentSort === "oldest" ? "true" : undefined}
      >
        Past → Now
      </Link>
    </nav>
  );
}
