"use client";

// Generic "Ask AI" control: a dot that opens a panel of one-tap prompt angles.
// Picking one copies "<prompt>\n\n<source>" to the clipboard and opens Google
// AI Mode in a new tab to paste into.
//
// No backend, no key, no dependency — the AI runs on the user's side of the
// window. Pure client enhancement; JS-off readers never see it and lose
// nothing, because everything it copies is already on the page.
//
// Two surfaces use this: the article spine (AskAiDot) and the resume
// (ResumeAskAi). They differ only in their prompts, their source text and
// their copy — the mechanics live here and in ./payload.ts.

import { useEffect, useRef, useState } from "react";

import { type AiModeIo, sendToAiMode } from "./payload";

const TOAST_MS = 4500;

export interface AiPrompt {
  /** Button text. */
  label: string;
  /** Prepended to the source text, separated by a blank line. */
  prefix: string;
}

export interface AskAiLabels {
  /** Visible text on the dot itself. */
  dot: string;
  /** Accessible name for the dot. */
  dotAria: string;
  /** Panel heading. */
  head: string;
  /** Pre-tap clarity: what picking a prompt actually does. */
  note: string;
  /** Confirmation after the copy. */
  toast: string;
  /** Placeholder + accessible name for the free-form field, when enabled. */
  freeForm?: { placeholder: string; aria: string };
}

export function AskAi({
  prompts,
  getSource,
  labels,
  className,
  io,
}: {
  prompts: readonly AiPrompt[];
  /** Read the text to send. Called at click time, never at render. */
  getSource: () => string;
  labels: AskAiLabels;
  /** Extra root class, for surface-specific placement. */
  className?: string;
  /** Test seam; defaults to the real clipboard + window.open. */
  io?: AiModeIo;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [question, setQuestion] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  // Copy the payload, then open the AI Mode tab — synchronously, within the
  // gesture. See payload.ts for why that order is load-bearing.
  function send(prefix: string): void {
    sendToAiMode(prefix, getSource(), io);
    setOpen(false);
    setQuestion("");
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), TOAST_MS);
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
    <div className={className ? `ask-ai ${className}` : "ask-ai"} ref={rootRef}>
      <button
        type="button"
        className={`ask-ai-dot${open ? " is-open" : ""}`}
        // Open the panel at every width — on mobile it renders as a labeled
        // bottom sheet. Picking a prompt is what copies and opens AI Mode, so
        // the new tab is always a deliberate, explained action rather than a
        // silent tap into a surprise new tab.
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={labels.dotAria}
      >
        <span className="ask-ai-dot-label mono" aria-hidden="true">
          {labels.dot}
        </span>
      </button>

      {/* Backdrop behind the mobile bottom sheet (CSS-hidden on laptop+). Tap
          to dismiss. */}
      {open ? (
        <div
          className="ask-ai-backdrop"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {open ? (
        <div className="ask-ai-panel" role="menu" aria-label={labels.head}>
          <p className="ask-ai-panel-head mono">{labels.head}</p>
          {prompts.map((p) => (
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
          {labels.freeForm ? (
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
                placeholder={labels.freeForm.placeholder}
                aria-label={labels.freeForm.aria}
              />
            </form>
          ) : null}
          <p className="ask-ai-note mono">{labels.note}</p>
        </div>
      ) : null}

      {copied ? (
        <div className="ask-ai-toast mono" role="status" aria-live="polite">
          {labels.toast}
        </div>
      ) : null}
    </div>
  );
}
