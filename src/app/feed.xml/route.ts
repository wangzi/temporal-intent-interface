// RSS 2.0 feed at /feed.xml — hand-rolled XML, no dependency. Server route
// handler; published entries only (the engine returns only published posts).
// CDN-cached via Cache-Control; the engine fetch itself is uncached.

import { listPosts } from "@/lib/engine/client";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://z.stillinlove.co"
).replace(/\/+$/, "");

const MAX_ITEMS = 50;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toUTCString();
}

export async function GET() {
  let posts = [] as Awaited<ReturnType<typeof listPosts>>["posts"];
  try {
    posts = (await listPosts({ sort: "newest" })).posts;
  } catch {
    posts = [];
  }

  const items = posts
    .slice(0, MAX_ITEMS)
    .map((p) => {
      const url = `${SITE}/post/${encodeURIComponent(p.slug)}`;
      const desc = (
        p.intent_statement ||
        p.core_insight ||
        p.title ||
        ""
      ).trim();
      const kicker = p.intent_label ? `${esc(p.intent_label)} — ` : "";
      return [
        "    <item>",
        `      <title>${esc(p.title)}</title>`,
        `      <link>${esc(url)}</link>`,
        `      <guid isPermaLink="true">${esc(url)}</guid>`,
        `      <pubDate>${rfc822(p.published_at)}</pubDate>`,
        `      <description>${kicker}${esc(desc)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const lastBuild = posts[0]?.published_at
    ? rfc822(posts[0].published_at)
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>z.</title>
    <link>${SITE}</link>
    <description>A personal journal. Reading as an active, AI-native operation. Time, intent, attention, relation.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
