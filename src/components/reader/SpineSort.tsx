// Sort control, integrated into the spine as a small node at the head of the
// timeline (relocated here from the Lens rail). Two direction links —
// Now → Past (newest first) / Past → Now (oldest first) — that preserve the
// current search query + topic selection. URL-driven <Link>s, so sorting works
// with JS off; the active direction is colored like the focus dot (.on).

import Link from "next/link";

import type { SortOrder } from "@/lib/engine/types";

// Build a "/" URL for a given sort, preserving the active q + topics so a sort
// flip never drops the current search/topic view. Mirrors LensRail's railHref.
function sortHref(sort: SortOrder, query: string, topics: string[]): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (topics.length) params.set("topics", topics.join(","));
  if (sort === "oldest") params.set("sort", "oldest");
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function SpineSort({
  currentSort,
  query,
  selectedTopics,
}: {
  currentSort: SortOrder;
  query: string;
  selectedTopics: string[];
}) {
  return (
    <nav className="spine-sort" aria-label="Sort order">
      <Link
        className={`spine-sort-opt${currentSort === "newest" ? " on" : ""}`}
        href={sortHref("newest", query, selectedTopics)}
        aria-current={currentSort === "newest" ? "true" : undefined}
      >
        Now → Past
      </Link>
      <Link
        className={`spine-sort-opt${currentSort === "oldest" ? " on" : ""}`}
        href={sortHref("oldest", query, selectedTopics)}
        aria-current={currentSort === "oldest" ? "true" : undefined}
      >
        Past → Now
      </Link>
    </nav>
  );
}
