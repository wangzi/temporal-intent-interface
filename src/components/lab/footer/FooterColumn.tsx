// Layout variant A — "Closing column".
//
// One centered 66ch serif column. The footer reads like the closing
// passage of the journal: the open threads woven into a sentence, the
// colophon written as prose (not a data grid), the ask as one quiet
// line, a single red period as the terminus. Labels dropped — type-as-
// prose carries it. The most literary / most "z." treatment.

import { ArchiveAsk } from "./ArchiveAsk";
import {
  asClause,
  corpusStats,
  uniqueThreads,
  DEFAULT_MOVES,
  type FooterMoves,
} from "@/lib/lab/footer-data";
import type { PostSummary } from "@/lib/engine/types";

export function FooterColumn({
  posts,
  moves = DEFAULT_MOVES,
}: {
  posts: PostSummary[];
  moves?: FooterMoves;
}) {
  const threads = uniqueThreads(posts).slice(0, 4);
  const { count, startYear } = corpusStats(posts);

  return (
    <footer className="lf lf-column" aria-label="Footer">
      <div className="lf-column-inner">
        {moves.threads && threads.length > 0 && (
          <p className="lf-col-threads" data-text-origin="canonical">
            Still turning over{" "}
            {threads.map((t, i) => (
              <span key={t.slug}>
                <a href={`/post/${t.slug}`} className="lf-col-thread">
                  {asClause(t.question)}
                </a>
                {i < threads.length - 2
                  ? ", "
                  : i === threads.length - 2
                    ? ", and "
                    : ""}
              </span>
            ))}
            .
          </p>
        )}

        {moves.colophon && (
          <p className="lf-col-colophon">
            All prose here is human. AI is summoned, never ambient — it
            answers when you ask and stays silent otherwise. No tracking, no
            account, nothing stored.
            {count > 0 && (
              <>
                {" "}
                {count} entries{startYear ? ` since ${startYear}` : ""}.
              </>
            )}
          </p>
        )}

        {moves.ask && <ArchiveAsk posts={posts} variant="column" />}

        {/* The Studio bridge now lives in the Lab (review sheet), not here.
            What remains is the terminus: a single red period. */}
        <p className="lf-col-foot">
          <span className="lf-period" aria-hidden="true">
            .
          </span>
        </p>
      </div>
    </footer>
  );
}
