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
      </TemporalLayout>
    );
  } catch (err) {
    if (err instanceof EngineNotFoundError) {
      notFound();
    }
    throw err;
  }
}
