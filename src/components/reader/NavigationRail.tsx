// The Lens — the leftside menu. Search + filter + sort over the archive,
// inspired by the Ghost Lens prototype. Everything lives in the URL
// (?q=, ?filter=, ?sort=) so it works JS-off and a link reproduces the
// exact slice; each control preserves the other facets via archiveHref.
//
// Pure server component. Persistent at ≥1080px (auto-hide on hover);
// slides in via body.nav-open at ≤1079px (TopBar hamburger).

import Link from "next/link";

import { archiveHref } from "@/lib/lens";
import type { PostSummary, SortOrder } from "@/lib/engine/types";

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

const SORTS: { key: SortOrder; label: string }[] = [
  { key: "newest", label: "newest" },
  { key: "oldest", label: "oldest" },
];

function SearchGlyph() {
  return (
    <svg
      className="lens-glyph"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.4" />
      <path d="M10.4 10.4 14 14" />
    </svg>
  );
}

export function NavigationRail({
  posts,
  currentFilter,
  currentQuery,
  currentSort = "newest",
}: {
  posts: PostSummary[];
  currentFilter?: string;
  currentQuery?: string;
  currentSort?: SortOrder;
}) {
  const intents = uniqueIntentLabels(posts);

  return (
    <nav className="rail" id="reader-rail" aria-label="Reader navigation">
      <Link className="brand" href="/" aria-label="z. — clear the lens">
        z<b>.</b>
      </Link>

      <div className="lens">
        {/* SEARCH — a GET form so Enter reloads with ?q= (JS-off safe). */}
        <form className="lens-block" method="get" action="/" role="search">
          <span className="lens-lbl">search</span>
          <div className="lens-search">
            <SearchGlyph />
            <input
              type="search"
              name="q"
              defaultValue={currentQuery ?? ""}
              placeholder="Search the archive"
              aria-label="Search the archive"
              autoComplete="off"
            />
            {currentQuery ? (
              <Link
                className="lens-clear"
                href={archiveHref({ filter: currentFilter, sort: currentSort })}
                aria-label="Clear search"
              >
                ✕
              </Link>
            ) : null}
          </div>
          {/* Preserve the other facets when the search form submits. */}
          {currentFilter ? (
            <input type="hidden" name="filter" value={currentFilter} />
          ) : null}
          {currentSort !== "newest" ? (
            <input type="hidden" name="sort" value={currentSort} />
          ) : null}
        </form>

        {/* FILTER — intent chips. */}
        <div className="lens-block">
          <span className="lens-lbl">filter</span>
          <div className="lens-chips">
            <Link
              className={`lens-chip${!currentFilter ? " on" : ""}`}
              href={archiveHref({ q: currentQuery, sort: currentSort })}
              aria-current={!currentFilter ? "true" : undefined}
            >
              all
            </Link>
            {intents.map((label) => {
              const on = currentFilter === label;
              return (
                <Link
                  key={label}
                  className={`lens-chip${on ? " on" : ""}`}
                  href={archiveHref({
                    q: currentQuery,
                    filter: label,
                    sort: currentSort,
                  })}
                  aria-current={on ? "true" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* SORT — segmented. */}
        <div className="lens-block">
          <span className="lens-lbl">sort</span>
          <div className="lens-segs">
            {SORTS.map((s) => {
              const on = currentSort === s.key;
              return (
                <Link
                  key={s.key}
                  className={`lens-seg${on ? " on" : ""}`}
                  href={archiveHref({
                    q: currentQuery,
                    filter: currentFilter,
                    sort: s.key,
                  })}
                  aria-current={on ? "true" : undefined}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
