// Lens public-snapshot read — used only by the /s/[token] server route to
// render an existing frozen share (no auth). The author create/list calls were
// removed along with the rail's snapshot UI; this public read remains so any
// one-time links that already exist still resolve.
//
// NEXT_PUBLIC_API_URL is ORIGIN-ONLY (https://studio.stillinlove.co); this
// module appends /api/v1. A /api/v1 suffix on the env var would double the path.

const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

// Absolute base or a legible failure. Without this, an unset env var yields a
// relative URL and server-side fetch throws a cryptic "Failed to parse URL".
function base(): string {
  if (!API) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set — the Lens snapshot API has no origin.",
    );
  }
  return API;
}

// Frozen entries are journalkit's denormalized Lens-entry shape (NOT TII's
// PostSummary): id/date/title/body plus the not-yet-modeled topics/people/
// type/importance.
export type FrozenEntry = {
  id: string;
  date: string;
  title: string;
  body: string;
  topics: string[];
  people: string[];
  type: string | null;
  importance: number | null;
};

export type PublicSnapshot = {
  title: string;
  count: number;
  created_at: string;
  entries: FrozenEntry[];
};

// Public, no auth. Used by the /s/[token] server route. Returns null on 404.
export async function getPublicSnapshot(
  token: string,
): Promise<PublicSnapshot | null> {
  const res = await fetch(`${base()}/api/v1/s/${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`public snapshot HTTP ${res.status}`);
  return (await res.json()) as PublicSnapshot;
}
