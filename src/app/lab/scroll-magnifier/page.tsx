"use client";

// /lab/scroll-magnifier — demo of the ScrollMagnifier UX experiment.
// Lives off the production reader; not linked from /. The Lab namespace
// is a sandbox for trying interactions before they earn a place in TII
// proper.

import { useState } from "react";

import { ScrollMagnifier } from "@/components/lab/ScrollMagnifier";

const SAMPLES: string[] = [
  "Beginnings",
  "Mornings",
  "Coffee, no phone",
  "A walk before words",
  "Old books on the table",
  "A note to my younger self",
  "The first hour",
  "What I tried not to notice",
  "A short answer",
  "The long version",
  "An honest mistake",
  "Quiet improvements",
  "One paragraph at a time",
  "Drafts I never sent",
  "A small repair",
  "The day after",
  "Listening better",
  "Hard to admit",
  "Easy to forget",
  "The next sentence",
  "A different ending",
  "Late afternoon light",
  "An evening walk",
  "Pages I underline",
  "Something I changed my mind about",
  "The exact word",
  "A reasonable doubt",
  "Trying again",
  "One more pass",
  "Closing time",
];

export default function ScrollMagnifierDemo() {
  const [focused, setFocused] = useState<{ index: number; text: string }>({
    index: 0,
    text: SAMPLES[0] ?? "",
  });

  return (
    <main
      style={{
        maxWidth: "44rem",
        margin: "0 auto",
        padding: "10vh 24px 4vh",
        minHeight: "100vh",
      }}
    >
      <header style={{ marginBottom: "32px" }}>
        <p
          className="mono"
          style={{
            fontSize: "0.6875rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--system-faint)",
            marginBottom: "10px",
          }}
        >
          Lab · experiment
        </p>
        <h1
          style={{
            fontFamily: "var(--serif)",
            fontSize: "var(--t-title-read)",
            lineHeight: 1.12,
            letterSpacing: "-0.015em",
            color: "var(--ink)",
            marginBottom: "10px",
          }}
        >
          Scroll Magnifier
        </h1>
        <p
          style={{
            fontFamily: "var(--serif)",
            fontSize: "var(--t-body)",
            lineHeight: 1.55,
            color: "var(--ink-soft)",
            maxWidth: "var(--measure)",
          }}
        >
          A sliding ruler under a fixed magnifying lens. Scroll, trackpad,
          or arrow-keys — the item nearest the centerline scales toward 2×;
          neighbours shrink along a Gaussian falloff.
        </p>
      </header>

      <ScrollMagnifier
        items={SAMPLES}
        maxScale={2}
        minScale={0.75}
        falloff={0.55}
        onFocusChange={(index, text) => setFocused({ index, text })}
      />

      <footer
        className="mono"
        style={{
          marginTop: "32px",
          padding: "14px 16px",
          borderTop: "1px solid var(--rule)",
          fontSize: "0.75rem",
          letterSpacing: "0.04em",
          color: "var(--system)",
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <span>
          <span style={{ color: "var(--system-faint)" }}>focus &nbsp;·&nbsp; </span>
          {focused.index >= 0 ? `#${String(focused.index + 1).padStart(2, "0")}` : "—"}
        </span>
        <span style={{ color: "var(--ink)" }}>{focused.text}</span>
      </footer>
    </main>
  );
}
