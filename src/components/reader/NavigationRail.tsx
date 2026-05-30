// Persistent navigation rail at ≥1080px; slides in via `body.nav-open`
// at mobile (the toggle button lands in Step 11 — TopBar).
//
// The rail itself is a server component; filter links are real
// <a href="/?filter=..."> so JS-off readers (when the topbar's
// hamburger lands and toggles `nav-open`) navigate via URL changes,
// not in-page React state. Filter state lives in the URL.

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

export function NavigationRail({
  posts,
  currentFilter,
}: {
  posts: PostSummary[];
  currentFilter?: string;
}) {
  const intents = uniqueIntentLabels(posts);
  const noFilter = !currentFilter;
  return (
    <>
      <div className="scrim" id="rail-scrim" aria-hidden="true" />
      <nav className="rail" aria-label="Reader navigation">
        <span className="brand">
          z<b>.</b>
        </span>
        <div className="rail-section">
          <h2>Read</h2>
          <a
            className={`navlink${noFilter ? " on" : ""}`}
            href="/"
            aria-current={noFilter ? "page" : undefined}
          >
            Latest
          </a>
        </div>
        <div className="rail-section">
          <h2>Intents</h2>
          {intents.map((label) => {
            const isActive = currentFilter === label;
            return (
              <a
                key={label}
                className={`navlink${isActive ? " on" : ""}`}
                href={`/?filter=${encodeURIComponent(label)}`}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
