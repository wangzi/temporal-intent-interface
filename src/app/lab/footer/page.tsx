// /lab/footer — review surface for three footer LAYOUT variants.
// Not linked from production; off the reader. Fetches the corpus once
// (fixtures in preview, real engine on production) and renders each
// layout against live data so the *content* is held constant and only
// the typographic composition differs.
//
//   A · Closing column   — single 66ch serif passage; colophon as prose
//   B · The Index        — back-of-book: questions → leaders → entries
//   C · Spine annotations— content hangs off the spine terminus
//
// All three compose the same functional content (open threads, colophon,
// ask the archive, studio bridge) — different layout, same substance.

import { listPosts } from "@/lib/engine/client";
import type { PostSummary } from "@/lib/engine/types";

import { FooterColumn } from "@/components/lab/footer/FooterColumn";
import { FooterIndex } from "@/components/lab/footer/FooterIndex";
import { FooterSpine } from "@/components/lab/footer/FooterSpine";

// Engine client fetches no-store → render per request (a lab surface).
export const dynamic = "force-dynamic";

function Note({ tag, title, why }: { tag: string; title: string; why: string }) {
  return (
    <header className="lf-note">
      <p className="lf-note-n">{tag}</p>
      <h2 className="lf-note-title">{title}</h2>
      <p className="lf-note-why">{why}</p>
    </header>
  );
}

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
    <main className="lf-page">
      <header className="lf-head">
        <p className="lf-head-kicker">Lab · footer layouts</p>
        <h1 className="lf-head-title">A footer worth having</h1>
        <p className="lf-head-lede">
          Three layout variants of one functional footer — open threads,
          colophon, ask-the-archive, studio bridge — each composed
          typographically, each rendered against the live corpus. The spine
          terminates here, so the footer is the floor of the timeline: the
          natural home for the whole-corpus and meta views the reading column
          refuses. Pick one (or blend).
        </p>
      </header>

      <section className="lf-section">
        <Note
          tag="Variant A"
          title="Closing column"
          why="One 66ch serif passage. Threads woven into a sentence, colophon as prose, ask as one quiet line, a single red period as the terminus. Labels dropped — the most literary, most ‘z.’ treatment."
        />
        <FooterColumn posts={posts} />
      </section>

      <section className="lf-section">
        <Note
          tag="Variant B"
          title="The Index"
          why="Back-of-book. Each open question (serif) connects by a leader of dots to its entry (mono, right-aligned). Colophon and ask are index rows too. Most craft, most navigable — literally an index to the corpus."
        />
        <FooterIndex posts={posts} />
      </section>

      <section className="lf-section">
        <Note
          tag="Variant C"
          title="Spine annotations"
          why="The spine drops into the footer; its red end-cap becomes the first bullet. Corpus stat on the dot, threads branching as ├ nodes, ask as the └ terminus. Mono scaffolding, serif author questions — the most on-metaphor."
        />
        <FooterSpine posts={posts} />
      </section>

      <footer className="lf-spine-foot" style={{ marginTop: "8vh" }}>
        <span style={{ color: "var(--system-faint)" }}>
          lab branch · not production · review + pick a direction
        </span>
      </footer>
    </main>
  );
}
