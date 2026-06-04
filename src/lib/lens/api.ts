// Lens snapshot API — author create (client-side, Bearer the Supabase JWT) +
// public read for the /s/[token] route (no auth). Separate from the server-only
// engine BFF (lib/engine/client.ts), which uses the keyed JOURNALKIT_API_URL.
//
// NEXT_PUBLIC_API_URL is ORIGIN-ONLY (https://studio.stillinlove.co); this
// module appends /api/v1. There is intentionally NO listSnapshots — the rail
// shows only the link you just created, never the full history.

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

export type SnapshotDescriptor = {
  topics: string[];
  sort: "newest" | "oldest";
  query: string;
  /** Active Focus route id when snapping a focused route view (additive — the
   *  journalkit snapshot descriptor is JSONB and accepts these). */
  focus?: string;
  route_label?: string;
};

export type SnapshotMeta = {
  token: string;
  title: string;
  count: number;
  created_at: string;
};

export class SnapshotError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SnapshotError";
  }
}

// Author-only. Freezes the given entry ids (in order) into an immutable
// snapshot; returns its share token. Throws SnapshotError on a non-2xx.
export async function createSnapshot(
  accessToken: string,
  entryIds: string[],
  descriptor: SnapshotDescriptor,
): Promise<SnapshotMeta> {
  const res = await fetch(`${base()}/api/v1/snapshots`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ entry_ids: entryIds, descriptor }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new SnapshotError(body || `HTTP ${res.status}`, res.status);
  }
  return (await res.json()) as SnapshotMeta;
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
