"use client";

// Post-route only. A red "Ask AI" dot that rides the article spine, just below
// the Back node. Click → copy the whole article (title + body text) to the
// clipboard and open Google AI Mode in a new tab, where the reader pastes it
// (the full article is too long for a ?q= URL, so we copy + paste instead).
//
// Pure client enhancement: JS-off readers never see it and lose nothing. The
// dot's VERTICAL position is CSS (40vh + offset); ReaderControlsIsland sets its
// horizontal x onto the spine (same anchor it uses for the Back node), since the
// post spine sits at the centered column's edge, not a fixed viewport x.

import { useEffect, useRef, useState } from "react";

import { copyToClipboard } from "@/lib/copy-prompt";

// Canonical Google AI Mode entry point (udm=50). Session/campaign params from a
// normal visit (biw/bih/source/aep/...) are intentionally omitted.
const AI_MODE_URL = "https://www.google.com/search?udm=50";
const TOAST_MS = 4500;

export function AskAiDot({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  function ask(): void {
    const body = document.querySelector<HTMLElement>(".attn-body");
    const bodyText = body ? body.innerText.trim() : "";
    const article = bodyText ? `${title}\n\n${bodyText}` : title;
    // Initiate the copy, then open AI Mode SYNCHRONOUSLY inside the click
    // gesture — awaiting first would let the browser block the popup (the
    // gesture expires across an await). copyToClipboard never throws
    // (navigator.clipboard → hidden-textarea fallback).
    void copyToClipboard(article);
    window.open(AI_MODE_URL, "_blank", "noopener,noreferrer");
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), TOAST_MS);
  }

  return (
    <>
      <button
        type="button"
        className="ask-ai-dot"
        onClick={ask}
        aria-label="Copy this article and open Google AI Mode to paste it"
      >
        <span className="ask-ai-dot-label mono" aria-hidden="true">
          ↗ Ask AI
        </span>
      </button>
      {copied ? (
        <div className="ask-ai-toast mono" role="status" aria-live="polite">
          Article copied — paste it into Google AI Mode (⌘/Ctrl + V)
        </div>
      ) : null}
    </>
  );
}
