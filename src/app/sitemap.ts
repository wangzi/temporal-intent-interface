// Sitemap (served at /sitemap.xml) — home and every published post.
//
// /resume is deliberately ABSENT while it sits behind the pre-publication gate
// (src/lib/resume/gate.ts): a sitemap is an invitation to crawl, and the page
// now answers crawlers with a redirect to an unlock form. Re-add the entry in
// the same change that removes the gate. Role views (/resume?role=…) stay out
// regardless — they are noindex views that canonicalize to /resume.
import type { MetadataRoute } from "next";

import { listPosts } from "@/lib/engine/client";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://z.stillinlove.co"
).replace(/\/+$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: Awaited<ReturnType<typeof listPosts>>["posts"] = [];
  try {
    posts = (await listPosts({ sort: "newest" })).posts;
  } catch {
    posts = [];
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE}/post/${p.slug}`,
    lastModified: p.published_at ? new Date(p.published_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: `${SITE}/`, changeFrequency: "daily", priority: 1 },
    ...postEntries,
  ];
}
