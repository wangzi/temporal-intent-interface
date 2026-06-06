"use client";

// Post-route "Ask AI" control on the article spine. Click the red dot →
// (laptop+) a panel slides into the empty space LEFT of the spine with one-tap
// prompt angles; pick one → copy "<prompt>\n\n<article>" to the clipboard and
// open Google AI Mode in a new tab to paste. On narrow viewports (no left
// margin) the dot copies the article + opens AI Mode directly.
//
// No backend, no key — the AI runs on Google's side. Pure client enhancement;
// JS-off readers never see it. The dot's vertical position is CSS; the island
// sets its x (and --spine-vpx, used to anchor the panel) onto the spine.

import { useEffect, useRef, useState } from "react";

const AI_MODE_URL = "https://www.google.com/search?udm=50";

// SYNCHRONOUS clipboard write (hidden textarea + execCommand). We can't use the
// async navigator.clipboard.writeText here: it's fired-and-forgotten right
// before window.open(), which steals focus, and writeText fails the instant the
// document loses focus — leaving the clipboard stuck on a previous copy (every
// prompt then pasted the same text). execCommand('copy') completes within the
// click gesture, before the new tab takes focus.
function copyTextSync(text: string): void {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText =
      "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    document.execCommand("copy");
    document.body.removeChild(ta);
  } catch {
    // best effort — the copy is non-critical to opening AI Mode
  }
}
const PANEL_MIN_WIDTH = 1080; // below this there's no left margin → direct action
const TOAST_MS = 4500;

const PROMPTS: { label: string; prefix: string }[] = [
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
    prefix: "Explain this article like I'm five (ELI5), in simple, plain language.",
  },
];

export function AskAiDot({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [question, setQuestion] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  function articleText(): string {
    const body = document.querySelector<HTMLElement>(".attn-body");
    const bodyText = body ? body.innerText.trim() : "";
    return bodyText ? `${title}\n\n${bodyText}` : title;
  }

  // Copy "<prompt>\n\n<article>", then open the AI Mode tab SYNCHRONOUSLY within
  // the gesture (awaiting first lets the browser block the popup).
  function send(prefix: string): void {
    const article = articleText();
    const payload = prefix ? `${prefix}\n\n${article}` : article;
    // Copy first (synchronously, while focused), THEN open the tab.
    copyTextSync(payload);
    window.open(AI_MODE_URL, "_blank", "noopener,noreferrer");
    setOpen(false);
    setQuestion("");
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), TOAST_MS);
  }

  function onDotClick(): void {
    if (window.innerWidth >= PANEL_MIN_WIDTH) setOpen((o) => !o);
    else send(""); // narrow: no left margin → copy + open directly
  }

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  // Close the panel on outside-click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="ask-ai" ref={rootRef}>
      <button
        type="button"
        className={`ask-ai-dot${open ? " is-open" : ""}`}
        onClick={onDotClick}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Ask Google AI about this article"
      >
        <span className="ask-ai-dot-label mono" aria-hidden="true">
          ↗ Ask AI
        </span>
      </button>

      {open ? (
        <div className="ask-ai-panel" role="menu" aria-label="Ask Google AI">
          <p className="ask-ai-panel-head mono">Ask Google AI</p>
          {PROMPTS.map((p) => (
            <button
              key={p.label}
              type="button"
              role="menuitem"
              className="ask-ai-opt mono"
              onClick={() => send(p.prefix)}
            >
              {p.label}
              <span aria-hidden="true"> →</span>
            </button>
          ))}
          <form
            className="ask-ai-ask"
            onSubmit={(e) => {
              e.preventDefault();
              send(question.trim());
            }}
          >
            <input
              className="ask-ai-input mono"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your own…"
              aria-label="Ask your own question about this article"
            />
          </form>
        </div>
      ) : null}

      {copied ? (
        <div className="ask-ai-toast mono" role="status" aria-live="polite">
          Copied — paste it into Google AI Mode (⌘/Ctrl + V)
        </div>
      ) : null}
    </div>
  );
}
