// Persistent navigation rail at ≥1080px; slides in via `body.nav-open`
// at mobile (toggled by <TopBar>'s hamburger). Pure server component.
//
// The scrim that backs the slide-in lives in <TopBar> (which needs
// the click handler). Filter links are real <a href="/?filter=...">
// so JS-off readers navigate via URL changes, not React state. Filter
// state lives in the URL.

import Link from "next/link";

import type { PostSummary } from "@/lib/engine/types";

function uniqueIntentLabels(posts: PostSummary[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const p of posts) {
    if (!seen.has(p.intent_label)) {
      seen.add(p.intent_label);
      order.push(p.intent_label);
    }
  }
  return order;
}

// Build a sort URL, preserving any active ?filter=. Newest is the default so
// it omits the param (canonical "/"). Lifted from the removed TimeIndex.
function sortHref(sort: "newest" | "oldest", filter?: string): string {
  const sp = new URLSearchParams();
  if (sort !== "newest") sp.set("sort", sort);
  if (filter) sp.set("filter", filter);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

export function NavigationRail({
  posts,
  currentFilter,
  currentSort = "newest",
}: {
  posts: PostSummary[];
  currentFilter?: string;
  currentSort?: "newest" | "oldest";
}) {
  const intents = uniqueIntentLabels(posts);
  const noFilter = !currentFilter;
  return (
    <nav className="rail" id="reader-rail" aria-label="Reader navigation">
      <span className="brand">
        z<b>.</b>
      </span>
      <div className="rail-section">
        <h2>Read</h2>
        <Link
          className={`navlink${noFilter ? " on" : ""}`}
          href="/"
          aria-current={noFilter ? "page" : undefined}
        >
          Latest
        </Link>
      </div>
      <div className="rail-section">
        <h2>Sort</h2>
        <Link
          className={`navlink${currentSort === "newest" ? " on" : ""}`}
          href={sortHref("newest", currentFilter)}
          aria-current={currentSort === "newest" ? "page" : undefined}
        >
          Newest first
        </Link>
        <Link
          className={`navlink${currentSort === "oldest" ? " on" : ""}`}
          href={sortHref("oldest", currentFilter)}
          aria-current={currentSort === "oldest" ? "page" : undefined}
        >
          Oldest first
        </Link>
      </div>
      <div className="rail-section">
        <h2>Intents</h2>
        {intents.map((label) => {
          const isActive = currentFilter === label;
          return (
            <Link
              key={label}
              className={`navlink${isActive ? " on" : ""}`}
              href={`/?filter=${encodeURIComponent(label)}`}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
