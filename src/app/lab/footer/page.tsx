// /lab/footer — the Go-review Lab. A reader-facing surface where the
// reader composes the footer's "position": two Go stones (bottom-right,
// no label) open a white review sheet; choosing an OPENING (layout) and
// placing MOVES (features) reconfigures the active footer live, in the
// stage above. Session-only — nothing persists.
//
// Conceptual frame: AlphaGo. Black stone = the machine's move (37),
// white = the human's move (78) — the journal's human/AI duality made
// into an object, at the terminus of the timeline.
//
// Mocked here off-production so the interaction can be tuned before it
// touches the real reader footer.

import { listPosts } from "@/lib/engine/client";
import type { PostSummary } from "@/lib/engine/types";

import { BoardLab } from "@/components/lab/footer/BoardLab";

// Engine client fetches no-store → render per request (a lab surface).
export const dynamic = "force-dynamic";

export default async function FooterLab() {
  let posts: PostSummary[] = [];
  try {
    const response = await listPosts({ sort: "newest" });
    posts = response.posts;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[lab/footer] engine error:", err);
  }

  return (
    <main className="boardlab-page">
      <header className="boardlab-head">
        <p className="lf-head-kicker">Lab · the review</p>
        <h1 className="lf-head-title">Move 37 / Move 78</h1>
        <p className="lf-head-lede">
          Two stones rest at the bottom-right — black, the machine’s move;
          white, the human’s. Click either to slide up the review and play
          the footer’s moves: choose an opening (the layout), place or lift
          the features. The stage below reconfigures live. Nothing is saved.
        </p>
      </header>

      <BoardLab posts={posts} />
    </main>
  );
}
