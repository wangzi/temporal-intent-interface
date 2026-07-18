// Sitemap (served at /sitemap.xml) — home, the resume, and every published
// post. Role views (/resume?role=…) are deliberately absent: they are noindex
// views of the same document and all canonicalize to /resume.
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
    { url: `${SITE}/resume`, changeFrequency: "monthly", priority: 0.9 },
    ...postEntries,
  ];
}
