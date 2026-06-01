// Experiment 2 — "Provenance colophon" (anti-legalese).
//
// The direct answer to "footers are useless legalese + social links."
// Instead of a privacy policy nobody reads, a radically honest standing
// statement: what's human vs AI here, what the machine does and doesn't
// do, plus live corpus stats. A trust artifact — the AI-era replacement
// for cookie banners. It also makes the product's own provenance
// discipline legible to readers as a feature.
//
// Server component. System/meta voice → mono. One red accent only.
// Stats are computed from the corpus the page already fetched (no
// extra request).

import { formatAbsoluteDate } from "@/lib/format";
import type { PostSummary } from "@/lib/engine/types";

function corpusStats(posts: PostSummary[]) {
  const count = posts.length;
  const dates = posts.map((p) => p.published_at).sort();
  const oldest = dates[0];
  const newest = dates[dates.length - 1];
  const minutes = posts.reduce((sum, p) => sum + (p.reading_time || 0), 0);
  return { count, oldest, newest, minutes };
}

export function FooterColophon({ posts }: { posts: PostSummary[] }) {
  const { count, oldest, newest, minutes } = corpusStats(posts);
  return (
    <section className="labf labf-colophon mono" aria-label="Colophon">
      <p className="labf-kicker">Colophon</p>
      <dl className="labf-colophon-grid">
        <div>
          <dt>Words</dt>
          <dd>
            All prose here is human. Serif is the author<span className="labf-sep">·</span>
            mono is the machine. The seam is always visible.
          </dd>
        </div>
        <div>
          <dt>AI</dt>
          <dd>
            Summoned, never ambient. It answers when you ask and stays
            silent otherwise. It never rewrites a sentence or speaks as
            the author.
          </dd>
        </div>
        <div>
          <dt>You</dt>
          <dd>
            No tracking, no ads, no cookies, no account. Nothing about
            this visit is stored.
          </dd>
        </div>
        <div>
          <dt>Corpus</dt>
          <dd>
            {count} entries<span className="labf-sep">·</span>
            {minutes} min of reading<span className="labf-sep">·</span>
            {oldest ? formatAbsoluteDate(oldest) : "—"} →{" "}
            {newest ? formatAbsoluteDate(newest) : "—"}
          </dd>
        </div>
      </dl>
      <p className="labf-colophon-foot">
        Rendered by journalkit, read through TII.{" "}
        <a href="https://studio.stillinlove.co" className="labf-link">
          Studio / Sign in →
        </a>
      </p>
    </section>
  );
}
