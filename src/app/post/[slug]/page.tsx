// Single-post Attention route. SSR per PRD §17.4 — JS-off readers
// can read the entire post; the back link is a real <a href="/">.
//
// ISR with revalidate=300. Post bodies change rarely; 5 min staleness
// is acceptable. Unknown slugs hit on-demand SSR (`dynamicParams = true`).

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Dot } from "@/components/reader/Dot";
import { Footer } from "@/components/reader/Footer";
import { TemporalLayout } from "@/components/reader/TemporalLayout";
import { AttentionView } from "@/components/reader/AttentionView";
import {
  EngineNotFoundError,
  getPost,
} from "@/lib/engine/client";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { post } = await getPost(slug);
    // Strip HTML for the description: take a plain-text excerpt.
    const description = post.body_html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
    return {
      title: post.title,
      description,
      openGraph: {
        title: post.title,
        description,
        type: "article",
        publishedTime: post.published_at,
        authors: post.authors.map((a) => a.display_name),
      },
    };
  } catch (err) {
    if (err instanceof EngineNotFoundError) {
      return { title: "Not found" };
    }
    return { title: "z." };
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const { post } = await getPost(slug);
    return (
      <TemporalLayout>
        <AttentionView post={post} />
        <Footer />
        <Dot />
      </TemporalLayout>
    );
  } catch (err) {
    if (err instanceof EngineNotFoundError) {
      notFound();
    }
    throw err;
  }
}
