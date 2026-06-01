// Experiment 1 — "Unresolved threads".
//
// Aggregates every entry's authored `central_question` into the footer:
// the questions the author is still chewing on. Click one → the entry
// that carries it. This is uniquely possible because TII stores intent
// as structured data; no ordinary blog could build it. It turns the
// footer into the journal's intellectual throughline — "here's what
// I'm still trying to figure out," not "here's what I published."
//
// Server component. The questions are authored text → serif +
// data-text-origin="canonical". The framing labels are system → mono.

import type { PostSummary } from "@/lib/engine/types";

type Thread = { question: string; slug: string; label: string };

function uniqueThreads(posts: PostSummary[]): Thread[] {
  const seen = new Set<string>();
  const out: Thread[] = [];
  for (const p of posts) {
    const q = p.central_question?.trim();
    if (!q || seen.has(q)) continue;
    seen.add(q);
    out.push({ question: q, slug: p.slug, label: p.intent_label });
  }
  return out;
}

export function FooterThreads({ posts }: { posts: PostSummary[] }) {
  const threads = uniqueThreads(posts);
  return (
    <section className="labf labf-threads" aria-label="Open threads">
      <p className="labf-kicker mono">Still thinking about</p>
      <ul className="labf-thread-list">
        {threads.map((t) => (
          <li key={t.slug}>
            <a href={`/post/${t.slug}`} className="labf-thread">
              <span className="labf-thread-q" data-text-origin="canonical">
                {t.question}
              </span>
              <span className="labf-thread-label mono">{t.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
