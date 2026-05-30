"use client";

// Watches text selections inside the post body and offers a "Copy
// Prompt" affordance near the selection. Mounted only on /post/[slug]
// (the post page passes the meta in).
//
// Behaviour:
//   - Listens to `selectionchange` on `document`.
//   - Waits SETTLE_MS (250) for the selection to stabilise.
//   - When ≥3 chars selected inside `.attn-body`, shows a floating
//     button anchored to the selection's bottom-right.
//   - Click → buildPrompt → copyToClipboard.
//     - On success: aria-live="polite" "Copied" pill for 2s.
//     - On failure: <dialog>-like fallback panel with the prompt in
//       a textarea so the reader can select + copy manually.
//   - Esc dismisses any UI.
//
// Keyboard parity (PRD §15 — "Accessible Thinking Mode, required"):
//   - On mount, every <p data-text-origin="canonical"> inside
//     .attn-body gets tabindex="0" so keyboard users can focus it.
//   - When such a paragraph is focused and the reader presses
//     Enter or Space, the paragraph's text is treated as the
//     "selection" and the same Copy Prompt flow fires. This gives
//     pointer-free access to Copy Prompt.
//
// PRD §17.29: never fails. No network calls; offline-safe.

import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildPrompt,
  copyToClipboard,
  type PostForPrompt,
} from "@/lib/copy-prompt";

const SETTLE_MS = 250;
const MIN_LENGTH = 3;
const COPIED_TOAST_MS = 2000;

type State =
  | { kind: "idle" }
  | { kind: "ready"; selection: string; x: number; y: number }
  | { kind: "copied" }
  | { kind: "manual"; text: string };

export function SelectionLayer({ post }: { post: PostForPrompt }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const settleRef = useRef<number | null>(null);
  const dialogRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function onSelectionChange(): void {
      if (settleRef.current !== null) {
        window.clearTimeout(settleRef.current);
      }
      settleRef.current = window.setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
          setState((s) => (s.kind === "ready" ? { kind: "idle" } : s));
          return;
        }
        const text = sel.toString().trim();
        if (text.length < MIN_LENGTH) {
          setState((s) => (s.kind === "ready" ? { kind: "idle" } : s));
          return;
        }
        const range = sel.getRangeAt(0);
        const body = document.querySelector<HTMLElement>(".attn-body");
        if (!body || !body.contains(range.commonAncestorContainer)) {
          setState((s) => (s.kind === "ready" ? { kind: "idle" } : s));
          return;
        }
        const rect = range.getBoundingClientRect();
        setState({
          kind: "ready",
          selection: text,
          x: rect.right,
          y: rect.bottom,
        });
      }, SETTLE_MS);
    }

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        setState({ kind: "idle" });
      }
    }

    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("keydown", onKeyDown);
      if (settleRef.current !== null) {
        window.clearTimeout(settleRef.current);
      }
    };
  }, []);

  // Keyboard parity for Copy Prompt: make canonical paragraphs in the
  // post body focusable; Enter/Space on a focused paragraph copies it.
  useEffect(() => {
    const paragraphs = document.querySelectorAll<HTMLElement>(
      '.attn-body p[data-text-origin="canonical"]',
    );
    paragraphs.forEach((p) => {
      p.setAttribute("tabindex", "0");
      p.setAttribute(
        "aria-label",
        `Paragraph. Press Enter to copy a prompt for this paragraph.`,
      );
    });

    async function copyParagraph(text: string): Promise<void> {
      const prompt = buildPrompt(post, text);
      const ok = await copyToClipboard(prompt);
      if (ok) {
        setState({ kind: "copied" });
        window.setTimeout(() => {
          setState((s) => (s.kind === "copied" ? { kind: "idle" } : s));
        }, COPIED_TOAST_MS);
      } else {
        setState({ kind: "manual", text: prompt });
      }
    }

    function onKey(e: KeyboardEvent): void {
      if (e.key !== "Enter" && e.key !== " ") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Only paragraphs inside .attn-body tagged as canonical text.
      const para = target.closest<HTMLElement>(
        '.attn-body p[data-text-origin="canonical"]',
      );
      if (!para || para !== target) return;
      const text = (para.textContent ?? "").trim();
      if (text.length < MIN_LENGTH) return;
      e.preventDefault();
      void copyParagraph(text);
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // Clean up: not strictly necessary, but tidy for unmount during
      // route changes within the SPA.
      paragraphs.forEach((p) => {
        p.removeAttribute("tabindex");
        p.removeAttribute("aria-label");
      });
    };
  }, [post]);

  // When the manual dialog opens, preselect the text so paste is one
  // keystroke away.
  useEffect(() => {
    if (state.kind === "manual" && dialogRef.current) {
      dialogRef.current.focus();
      dialogRef.current.select();
    }
  }, [state.kind]);

  const handleCopy = useCallback(async () => {
    if (state.kind !== "ready") return;
    const text = buildPrompt(post, state.selection);
    const ok = await copyToClipboard(text);
    if (ok) {
      setState({ kind: "copied" });
      window.setTimeout(() => {
        setState((s) => (s.kind === "copied" ? { kind: "idle" } : s));
      }, COPIED_TOAST_MS);
    } else {
      setState({ kind: "manual", text });
    }
  }, [state, post]);

  if (state.kind === "idle") return null;

  if (state.kind === "ready") {
    return (
      <button
        type="button"
        className="mono"
        onClick={handleCopy}
        style={{
          position: "fixed",
          left: `${state.x}px`,
          top: `${state.y + 8}px`,
          transform: "translateX(-100%)",
          padding: "7px 11px",
          background: "var(--field)",
          border: "1px solid var(--rule)",
          borderRadius: "6px",
          fontSize: "0.75rem",
          color: "var(--ink)",
          letterSpacing: "0.04em",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
          zIndex: 60,
          cursor: "pointer",
          backdropFilter: "blur(8px)",
        }}
      >
        Copy Prompt
      </button>
    );
  }

  if (state.kind === "copied") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mono"
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          padding: "9px 13px",
          background: "color-mix(in srgb, var(--field) 86%, transparent)",
          backdropFilter: "blur(10px)",
          border: "1px solid var(--rule)",
          borderRadius: "7px",
          fontSize: "0.6875rem",
          color: "var(--system)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          zIndex: 60,
        }}
      >
        Copied
      </div>
    );
  }

  // manual fallback dialog
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Copy prompt manually"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(0, 0, 0, 0.42)",
        display: "grid",
        placeItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "var(--field)",
          padding: "20px 22px",
          borderRadius: "8px",
          maxWidth: "560px",
          width: "100%",
          border: "1px solid var(--rule)",
        }}
      >
        <p
          className="mono"
          style={{
            fontSize: "0.6875rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--system)",
            marginBottom: "12px",
          }}
        >
          Couldn&apos;t auto-copy · select all + copy
        </p>
        <textarea
          ref={dialogRef}
          readOnly
          value={state.text}
          style={{
            width: "100%",
            minHeight: "180px",
            padding: "10px 12px",
            fontFamily: "var(--mono)",
            fontSize: "0.8125rem",
            lineHeight: 1.55,
            color: "var(--ink)",
            background: "color-mix(in srgb, var(--rule) 40%, transparent)",
            border: "1px solid var(--rule)",
            borderRadius: "4px",
            resize: "vertical",
          }}
        />
        <button
          type="button"
          className="mono"
          onClick={() => setState({ kind: "idle" })}
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            fontSize: "0.75rem",
            color: "var(--system)",
            border: "1px solid var(--rule)",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Close · esc
        </button>
      </div>
    </div>
  );
}
