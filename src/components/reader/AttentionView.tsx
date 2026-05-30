// Layer-2 Attention. The route page for /post/[slug].
// NOT a modal — see plan/CLAUDE.md §interaction "Attention is a route".
// The back link is a real <a href="/"> so it works JS-off. JS-on
// keyboard layer (step 7) maps Escape → router.back().

import Link from "next/link";

import {
  formatAbsoluteDate,
  readingTimeLabel,
} from "@/lib/format";
import type { PostDetail } from "@/lib/engine/types";

import { CanonicalBody } from "./CanonicalBody";
import { Spine } from "./Spine";

export function AttentionView({ post }: { post: PostDetail }) {
  const headingId = `post-title-${post.post_id}`;
  return (
    <article aria-labelledby={headingId} className="attn-inner">
      <Spine />
      <Link className="attn-back mono" href="/">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        back
      </Link>
      <header>
        <div className="attn-label mono" data-text-origin="canonical">
          {post.intent_label}
        </div>
        <h1 className="attn-title" id={headingId}>
          {post.title}
        </h1>
        <div className="attn-meta mono">
          <time
            dateTime={post.published_at}
            title={formatAbsoluteDate(post.published_at)}
          >
            {formatAbsoluteDate(post.published_at)}
          </time>
          <span className="dot-sep" aria-hidden="true">
            {" · "}
          </span>
          <span>{readingTimeLabel(post.reading_time)}</span>
          {post.authors[0]?.display_name ? (
            <>
              <span className="dot-sep" aria-hidden="true">
                {" · "}
              </span>
              <span>{post.authors[0].display_name}</span>
            </>
          ) : null}
        </div>
      </header>
      <CanonicalBody html={post.body_html} />
      <p className="attn-hint mono">
        Select any passage to copy a prompt · esc to return
      </p>
    </article>
  );
}
