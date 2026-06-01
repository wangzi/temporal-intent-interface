// Layout variant B — "The Index".
//
// Back-of-book index. Each open question (serif) is connected by a
// leader of dots to its entry (mono, right-aligned), like an index
// connecting a term to its page. The colophon and the ask are index
// rows too. The most typographically crafted (leaders, tabular
// alignment, hanging) and arguably the most useful — it's literally a
// navigable index to the corpus.

import { ArchiveAsk } from "./ArchiveAsk";
import {
  corpusStats,
  uniqueThreads,
  DEFAULT_MOVES,
  type FooterMoves,
} from "@/lib/lab/footer-data";
import type { PostSummary } from "@/lib/engine/types";

function Row({
  term,
  children,
  termOrigin,
}: {
  term: string;
  children: React.ReactNode;
  termOrigin?: "canonical";
}) {
  return (
    <div className="lf-index-row">
      <dt className="lf-index-term" data-text-origin={termOrigin}>
        {term}
      </dt>
      <span className="lf-index-leader" aria-hidden="true" />
      <dd className="lf-index-ref">{children}</dd>
    </div>
  );
}

export function FooterIndex({
  posts,
  moves = DEFAULT_MOVES,
}: {
  posts: PostSummary[];
  moves?: FooterMoves;
}) {
  const threads = uniqueThreads(posts);
  const { count, startYear } = corpusStats(posts);

  return (
    <footer className="lf lf-index" aria-label="Footer">
      <p className="lf-index-kicker">Index</p>
      <dl className="lf-index-list">
        {moves.threads &&
          threads.map((t) => (
            <Row key={t.slug} term={t.question} termOrigin="canonical">
              <a href={`/post/${t.slug}`}>{t.title}</a>
            </Row>
          ))}
        {moves.colophon && (
          <Row term="Colophon">
            human · summoned · no-track · {count} entries
            {startYear ? ` · since ${startYear}` : ""}
          </Row>
        )}
        {moves.ask && (
          <div className="lf-index-row lf-index-row--ask">
            <dt className="lf-index-term">Ask</dt>
            <span className="lf-index-leader" aria-hidden="true" />
            <dd className="lf-index-ref">
              <ArchiveAsk posts={posts} variant="index" />
            </dd>
          </div>
        )}
        <Row term="Studio">
          <a href="https://studio.stillinlove.co">sign in →</a>
        </Row>
      </dl>
    </footer>
  );
}
