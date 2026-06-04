// Focus route header — shown in the reader body above a route's mapped entries
// when a Focus route is active. Product language: this is a "Focus route", never
// a topic / TOC / index. Aligned to the entry column (like .feed-status).

import type { FocusRouteMeta } from "@/lib/engine/types";

export function FocusRouteHeader({ route }: { route: FocusRouteMeta }) {
  // The "Tags:" line uses the route's plain aliases (no leading #).
  const tags = route.aliases ?? [];
  const n = route.entry_count;
  return (
    <header className="route-header">
      <h2 className="route-title">{route.label}</h2>
      {route.description ? (
        <p className="route-desc">{route.description}</p>
      ) : null}
      <p className="route-meta">
        <span className="route-count">
          {n} {n === 1 ? "entry" : "entries"}
        </span>
        {tags.length > 0 ? (
          <span className="route-tags">Tags: {tags.join(", ")}</span>
        ) : null}
      </p>
    </header>
  );
}
