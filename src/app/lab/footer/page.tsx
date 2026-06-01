// /lab/footer — review surface for three "functional footer" experiments.
// Not linked from production; off the reader. Fetches the corpus once
// (fixture mode) and renders each footer concept in its own section so
// the three can be compared in one scroll.
//
// The three concepts (see the components + the brainstorm):
//   1. Unresolved threads — the journal's open central_questions
//   2. Provenance colophon — radically honest anti-legalese
//   3. Ask the archive — query the corpus, get entries + the why
//
// Each renders against the real fixture corpus, so the data is live.

import { listPosts } from "@/lib/engine/client";
import type { PostSummary } from "@/lib/engine/types";

import { FooterThreads } from "@/components/lab/footer/FooterThreads";
import { FooterColophon } from "@/components/lab/footer/FooterColophon";
import { FooterAsk } from "@/components/lab/footer/FooterAsk";

// Render per-request: the engine client fetches with no-store, which is
// incompatible with static prerender (ISR). A lab review surface is fine
// to render dynamically; on Vercel (fixture mode on) it reads fixtures.
export const dynamic = "force-dynamic";

function Note({ n, title, why }: { n: number; title: string; why: string }) {
  return (
    <header className="labf-note">
      <p className="labf-note-n mono">Experiment {n}</p>
      <h2 className="labf-note-title">{title}</h2>
      <p className="labf-note-why">{why}</p>
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
    <main className="labf-page">
      <header className="labf-head">
        <p className="mono labf-head-kicker">Lab · footer experiments</p>
        <h1 className="labf-head-title">A footer worth having</h1>
        <p className="labf-head-lede">
          Three ways to make the footer functional instead of legalese +
          social links — each built on TII&apos;s intent layer, each rendered
          against the live corpus. The spine terminates here, so the footer is
          the floor of the timeline: the natural home for the whole-corpus,
          meta, and relational views the reading column refuses.
        </p>
      </header>

      <section className="labf-section">
        <Note
          n={1}
          title="Unresolved threads"
          why="Every entry's authored central question, aggregated — the questions still being chewed on. Click one → the entry that carries it. Only possible because intent is structured data."
        />
        <FooterThreads posts={posts} />
      </section>

      <section className="labf-section">
        <Note
          n={2}
          title="Provenance colophon"
          why="The anti-legalese answer: what's human vs AI, what the machine does and doesn't do, live corpus stats. A trust artifact instead of a privacy-policy link."
        />
        <FooterColophon posts={posts} />
      </section>

      <section className="labf-section">
        <Note
          n={3}
          title="Ask the archive"
          why="Replace social links with one input: ask the journal anything, get back real entries + the reason each matched. Phase-B prototype uses deterministic local matching over the intent layer; the contract is identical to the eventual engine-backed version."
        />
        <FooterAsk posts={posts} />
      </section>

      <footer className="labf-page-foot mono">
        lab branch · not production · review + pick a direction
      </footer>
    </main>
  );
}
