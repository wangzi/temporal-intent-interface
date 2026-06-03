// Public frozen snapshot — /s/[token]. No session required (the constraint):
// a server component that reads journalkit's public, author-agnostic endpoint
// and renders the exact frozen, ordered entry set in TII's visual language.
//
// force-dynamic: snapshots are immutable but the route is opened by opaque
// token, never prebuilt; no ISR. A 404 from journalkit → TII's not-found page.
// Unlisted (robots noindex) — shares are link-only, not crawlable index pages.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatAbsoluteDate } from "@/lib/format";
import { getPublicSnapshot } from "@/lib/lens/api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { token } = await params;
  try {
    const snap = await getPublicSnapshot(token);
    if (!snap) return { title: "Snapshot not found · z." };
    const description = `${snap.count} ${snap.count === 1 ? "entry" : "entries"}, frozen ${formatAbsoluteDate(snap.created_at)}`;
    return {
      title: `${snap.title} · z.`,
      description,
      openGraph: { title: snap.title, description, type: "article" },
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: "Snapshot · z." };
  }
}

export default async function SnapshotPage({ params }: Params) {
  const { token } = await params;
  const snap = await getPublicSnapshot(token);
  if (!snap) notFound();

  return (
    <main className="snap">
      <header className="snap-head">
        <Link className="snap-home" href="/" aria-label="z.stillinlove.co">
          z<b>.</b>
        </Link>
        <h1 className="snap-title">{snap.title}</h1>
        <p className="snap-meta">
          {snap.count} {snap.count === 1 ? "entry" : "entries"} · frozen{" "}
          <time dateTime={snap.created_at}>
            {formatAbsoluteDate(snap.created_at)}
          </time>
        </p>
      </header>

      <ol className="snap-list">
        {snap.entries.map((entry) => (
          <li key={entry.id} className="snap-entry">
            <p className="snap-entry-meta">
              <time dateTime={entry.date}>
                {formatAbsoluteDate(entry.date)}
              </time>
              {entry.topics.length > 0 ? (
                <span className="snap-topics"> · {entry.topics.join(" · ")}</span>
              ) : null}
            </p>
            <h2 className="snap-entry-title">{entry.title}</h2>
            {entry.body ? (
              <p className="snap-entry-body">{entry.body}</p>
            ) : null}
          </li>
        ))}
      </ol>

      <footer className="snap-foot">
        <Link href="/">← z.stillinlove.co</Link>
      </footer>
    </main>
  );
}
