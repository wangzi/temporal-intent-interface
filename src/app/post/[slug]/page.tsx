// Single-post Attention route. SSR per PRD §17.4 — JS-off readers
// can read the entire post; the back link is a real <a href="/">.
//
// ISR with revalidate=300. Post bodies change rarely; 5 min staleness
// is acceptable. Unknown slugs hit on-demand SSR (`dynamicParams = true`).

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Footer } from "@/components/reader/Footer";
import { LensRail } from "@/components/reader/LensRail";
import { ReaderControlsIsland } from "@/components/reader/ReaderControlsIsland";
import { SelectionLayer } from "@/components/reader/SelectionLayer";
import { TemporalLayout } from "@/components/reader/TemporalLayout";
import { AskAiDot } from "@/components/reader/AskAiDot";
import { AttentionView } from "@/components/reader/AttentionView";
import {
  EngineNotFoundError,
  getPost,
  listFocus,
} from "@/lib/engine/client";
import type { FocusResponse } from "@/lib/engine/types";

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
    // Plain-text excerpt from the body. Truncate at a word boundary (never
    // mid-word in a share card) and add an ellipsis.
    const excerpt = post.body_html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const clip = (text: string, max: number): string => {
      if (text.length <= max) return text;
      const slice = text.slice(0, max);
      const lastSpace = slice.lastIndexOf(" ");
      const base = lastSpace > max * 0.5 ? slice.slice(0, lastSpace) : slice;
      return `${base.replace(/[\s.,;:!?—–-]+$/u, "")}…`;
    };
    const label = post.intent_label?.trim();
    // SEO meta description: the body excerpt.
    const description = clip(excerpt, 155);
    // Share-card line leads with the intent label (the hook), like the RSS
    // items, then the excerpt.
    const cardDescription = clip(label ? `${label} — ${excerpt}` : excerpt, 200);
    return {
      title: post.title,
      description,
      alternates: { canonical: `/post/${slug}` },
      openGraph: {
        title: post.title,
        description: cardDescription,
        url: `/post/${slug}`,
        type: "article",
        publishedTime: post.published_at,
        authors: post.authors.map((a) => a.display_name),
        images: [
          {
            url: `/post/${slug}/opengraph-image`,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
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

    // The Lens rail (Focus routes + Search + Snap) renders here too, so the
    // trigger dot opens the same navigation surface from within Attention mode.
    // A focus failure degrades to an empty index — the rail still opens.
    let focus: FocusResponse = { categories: [], routes: [] };
    try {
      focus = await listFocus();
    } catch (focusErr) {
      // eslint-disable-next-line no-console
      console.error("[post] focus error:", focusErr);
    }

    return (
      <TemporalLayout
        rail={
          <LensRail
            posts={[post]}
            focus={focus}
            activeRoute={null}
            query=""
            currentSort="newest"
          />
        }
      >
        <AttentionView post={post} />
        <Footer />
        {/* No focus dot on a single post — the back button is the spine's node
            (positioned onto the spine by ReaderControlsIsland). */}
        <ReaderControlsIsland />
        <SelectionLayer
          post={{
            title: post.title,
            intent_label: post.intent_label,
            intent_statement: post.intent_statement,
          }}
        />
        <AskAiDot title={post.title} />
      </TemporalLayout>
    );
  } catch (err) {
    if (err instanceof EngineNotFoundError) {
      notFound();
    }
    throw err;
  }
}
