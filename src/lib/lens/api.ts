// Lens snapshot API — talks to journalkit directly from the client (author
// snapshot create/list, with the Supabase JWT) and from the /s/[token] server
// route (public read, no auth). Separate from the server-only engine BFF
// (lib/engine/client.ts), which uses the keyed JOURNALKIT_API_URL for reads.
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

export type SnapshotDescriptor = {
  topics: string[];
  sort: "newest" | "oldest";
  query: string;
};

export type SnapshotMeta = {
  token: string;
  title: string;
  count: number;
  created_at: string;
};

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

export class SnapshotError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SnapshotError";
  }
}

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

export async function listSnapshots(
  accessToken: string,
): Promise<SnapshotMeta[]> {
  const res = await fetch(`${base()}/api/v1/snapshots`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new SnapshotError(`HTTP ${res.status}`, res.status);
  return (await res.json()) as SnapshotMeta[];
}

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
