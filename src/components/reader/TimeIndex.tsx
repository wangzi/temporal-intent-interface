// The masthead — the head of the spine. No header bar: a single on/off
// sort toggle centred on the spine, in-flow at the top of the reading
// column. It shows ONLY the active state — ↓ Now (newest) or ↑ Past
// (oldest) — and clicking flips it. URL-driven (?sort=), so it works
// JS-off and a link reproduces the order. Pure server component.

import Link from "next/link";

function sortHref(sort: "newest" | "oldest", filter?: string): string {
  const sp = new URLSearchParams();
  if (sort !== "newest") sp.set("sort", sort);
  if (filter) sp.set("filter", filter);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

export function TimeIndex({
  currentSort = "newest",
  currentFilter,
}: {
  currentSort?: "newest" | "oldest";
  currentFilter?: string;
}) {
  const isNewest = currentSort === "newest";

  return (
    <div className="masthead">
      <Link
        className="spine-sort"
        href={sortHref(isNewest ? "oldest" : "newest", currentFilter)}
        aria-label={`Sorted ${
          isNewest ? "newest" : "oldest"
        } first. Switch to ${isNewest ? "oldest" : "newest"} first.`}
      >
        <span className="spine-sort-arrow" aria-hidden="true">
          {isNewest ? "↓" : "↑"}
        </span>
        <span className="spine-sort-label">{isNewest ? "Now" : "Past"}</span>
      </Link>
    </div>
  );
}
