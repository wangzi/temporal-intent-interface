// Layer-2 Attention. The route page for /post/[slug].
// NOT a modal — see plan/CLAUDE.md §interaction "Attention is a route".
// The back link is a real <a href="/"> so it works JS-off. JS-on
// keyboard layer (step 7) maps Escape → router.back().

import Link from "next/link";

import { formatAbsoluteDate, readingTimeLabel } from "@/lib/format";
import type { PostDetail } from "@/lib/engine/types";

import { CanonicalBody } from "./CanonicalBody";
import { Spine } from "./Spine";

export function AttentionView({ post }: { post: PostDetail }) {
  const headingId = `post-title-${post.post_id}`;
  return (
    <article aria-labelledby={headingId} className="attn-inner">
      <Spine />
      <Link className="attn-back" href="/" aria-label="Back to the archive">
        <span className="attn-back-mark" aria-hidden="true">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 6l-6 6 6 6" />
          </svg>
        </span>
        <span className="attn-back-label mono">Back</span>
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
      {post.intent_statement ||
      (post.core_insight_visible && post.core_insight) ||
      post.central_question ||
      post.topics.length > 0 ? (
        <section className="attn-intent" aria-label="Intent">
          {post.intent_statement ? (
            <>
              <span className="k">Intent</span>
              <p className="statement" data-text-origin="canonical">
                {post.intent_statement}
              </p>
            </>
          ) : null}
          {post.core_insight_visible && post.core_insight ? (
            <>
              <span className="k">Signal</span>
              <p className="insight" data-text-origin="canonical">
                {post.core_insight}
              </p>
            </>
          ) : null}
          {post.central_question ? (
            <>
              <span className="k">Question</span>
              <p className="question" data-text-origin="canonical">
                {post.central_question}
              </p>
            </>
          ) : null}
          {post.topics.length > 0 ? (
            <>
              <span className="k">Topics</span>
              <p className="topics">{post.topics.join(" · ")}</p>
            </>
          ) : null}
        </section>
      ) : null}
      <CanonicalBody html={post.body_html} />
      <p className="attn-hint mono">
        Select any passage to copy a prompt
        {/* "esc to return" is keyboard-only — hidden on touch (no Esc key;
            the ‹ ring is the back affordance there). */}
        <span className="attn-hint-kbd"> · esc to return</span>
      </p>
    </article>
  );
}
