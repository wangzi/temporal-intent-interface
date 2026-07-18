"use client";

// Post-route "Ask AI" control on the article spine. Click the red dot → a
// panel opens with one-tap prompt angles (a labeled bottom sheet on mobile);
// pick one → copy "<prompt>\n\n<article>" and open Google AI Mode to paste.
//
// The mechanics live in components/ai — this file is just the article's
// configuration of them: its prompts, its source text, its wording. The dot's
// vertical position is CSS; the island sets its x (and --spine-vpx, used to
// anchor the panel) onto the spine.

import { AskAi, type AiPrompt } from "@/components/ai/AskAi";

const PROMPTS: readonly AiPrompt[] = [
  { label: "TL;DR", prefix: "Give a tight TL;DR of this article." },
  {
    label: "1st Principle",
    prefix:
      "Break this article down to first principles — the foundational assumptions and truths it rests on — then reason up from them.",
  },
  {
    label: "Inversion",
    prefix:
      "Apply inversion to this article: instead of how to succeed, describe what would guarantee the opposite outcome or cause it to fail, and what that reveals.",
  },
  {
    label: "ELI5",
    prefix:
      "Explain this article like I'm five (ELI5), in simple, plain language.",
  },
];

export function AskAiDot({ title }: { title: string }) {
  function articleText(): string {
    const body = document.querySelector<HTMLElement>(".attn-body");
    const bodyText = body ? body.innerText.trim() : "";
    return bodyText ? `${title}\n\n${bodyText}` : title;
  }

  return (
    <AskAi
      prompts={PROMPTS}
      getSource={articleText}
      labels={{
        dot: "Ask AI →",
        dotAria: "Ask Google AI about this article",
        head: "Ask Google AI",
        note: "Copies the article, then opens Google AI Mode to paste.",
        toast: "Article copied — paste it into Google AI Mode.",
        freeForm: {
          placeholder: "Ask your own…",
          aria: "Ask your own question about this article",
        },
      }}
    />
  );
}
