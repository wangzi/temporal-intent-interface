// Single-post Attention route. SSR per PRD §17.4 — JS-off readers
// can read the entire post; the back link is a real <a href="/">.
//
// ISR with revalidate=300. Post bodies change rarely; 5 min staleness
// is acceptable. Unknown slugs hit on-demand SSR (`dynamicParams = true`).

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Dot } from "@/components/reader/Dot";
import { FooterReview } from "@/components/reader/FooterReview";
import { ReaderControlsIsland } from "@/components/reader/ReaderControlsIsland";
import { SelectionLayer } from "@/components/reader/SelectionLayer";
import { TemporalLayout } from "@/components/reader/TemporalLayout";
import { AttentionView } from "@/components/reader/AttentionView";
import {
  EngineNotFoundError,
  getPost,
  listPosts,
} from "@/lib/engine/client";
import type { PostSummary } from "@/lib/engine/types";

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

    // The footer (threads / colophon / ask) describes the whole corpus,
    // so the post route fetches the list too. Non-fatal: if it fails the
    // footer degrades to an empty corpus and the post still renders.
    let corpus: PostSummary[] = [];
    try {
      corpus = (await listPosts({})).posts;
    } catch {
      // swallow — footer degrades, post is unaffected
    }

    return (
      <TemporalLayout>
        <AttentionView post={post} />
        <FooterReview posts={corpus} />
        <Dot />
        <ReaderControlsIsland />
        <SelectionLayer
          post={{
            title: post.title,
            intent_label: post.intent_label,
            intent_statement: post.intent_statement,
          }}
        />
      </TemporalLayout>
    );
  } catch (err) {
    if (err instanceof EngineNotFoundError) {
      notFound();
    }
    throw err;
  }
}
