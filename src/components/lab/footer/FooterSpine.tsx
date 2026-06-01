// Layout variant C — "Spine annotations".
//
// Exploits the one fact no other site has: the spine ends here. A short
// spine stub drops into the footer; its red end-cap dot becomes the
// first bullet. The corpus stat sits on the dot; the open threads
// branch off as ├ nodes; the ask is the final └ terminus. Everything
// flush to the spine axis, mono throughout. The most on-metaphor
// treatment — the footer as the timeline's closing annotations.

import { ArchiveAsk } from "./ArchiveAsk";
import {
  corpusStats,
  uniqueThreads,
  DEFAULT_MOVES,
  type FooterMoves,
} from "@/lib/lab/footer-data";
import type { PostSummary } from "@/lib/engine/types";

export function FooterSpine({
  posts,
  moves = DEFAULT_MOVES,
}: {
  posts: PostSummary[];
  moves?: FooterMoves;
}) {
  const threads = uniqueThreads(posts);
  const { count, startYear } = corpusStats(posts);

  return (
    <footer className="lf lf-spine" aria-label="Footer">
      <div className="lf-spine-stub" aria-hidden="true" />
      <span className="lf-spine-cap" aria-hidden="true" />

      <div className="lf-spine-body">
        {moves.colophon && (
          <p className="lf-spine-stat">
            {count} entries{startYear ? ` · since ${startYear}` : ""} · no
            tracking · ai summoned, never ambient
          </p>
        )}

        <ul className="lf-spine-threads">
          {moves.threads &&
            threads.map((t) => (
              <li key={t.slug} className="lf-spine-node">
                <span className="lf-spine-glyph" aria-hidden="true">
                  ├─
                </span>
                <a
                  href={`/post/${t.slug}`}
                  className="lf-spine-q"
                  data-text-origin="canonical"
                >
                  {t.question}
                </a>
              </li>
            ))}
          {moves.ask && (
            <li className="lf-spine-node lf-spine-node--end">
              <span className="lf-spine-glyph" aria-hidden="true">
                └─
              </span>
              <ArchiveAsk posts={posts} variant="spine" />
            </li>
          )}
        </ul>

        <p className="lf-spine-foot">
          <a href="https://studio.stillinlove.co" className="lf-spine-studio">
            studio / sign in →
          </a>
        </p>
      </div>
    </footer>
  );
}
