// Shared "Ask AI" mechanics: build the payload, copy it, open Google AI Mode.
//
// This is the logic half of AskAi.tsx, split out so it can be tested in the
// node environment without a DOM. The side effects are injected (see AiModeIo)
// for one specific reason: the copy-BEFORE-open ordering below is a real bug
// fix, and a comment alone can't stop someone from reordering it. With the io
// seam, payload.test.ts observes the actual call order.

/** Google AI Mode. No API, no key — the user pastes into their own session. */
export const AI_MODE_URL = "https://www.google.com/search?udm=50";

/** The two side effects `sendToAiMode` performs, in order. */
export interface AiModeIo {
  copy: (text: string) => void;
  open: (url: string) => void;
}

/**
 * SYNCHRONOUS clipboard write (hidden textarea + execCommand).
 *
 * We can't use async navigator.clipboard.writeText here: it's fired-and-
 * forgotten right before opening a tab, which steals focus, and writeText
 * fails the instant the document loses focus — leaving the clipboard stuck on
 * a previous copy (every prompt then pasted the same text). execCommand
 * completes within the click gesture, before the new tab takes focus.
 */
export function copyTextSync(text: string): void {
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

/** The browser io. Referenced lazily so importing this module stays DOM-free. */
export const browserIo: AiModeIo = {
  copy: copyTextSync,
  open: (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  },
};

/**
 * "<prefix>\n\n<source>" — or just the source when no prefix was given (the
 * free-form input submitted empty). Never emits leading blank lines.
 */
export function buildPayload(prefix: string, source: string): string {
  const p = prefix.trim();
  const s = source.trim();
  if (!p) return s;
  if (!s) return p;
  return `${p}\n\n${s}`;
}

/**
 * Copy the payload, THEN open AI Mode — in that order, synchronously, within
 * the click gesture. Awaiting anything first lets the browser block the popup;
 * opening first makes the copy fail on focus loss. Returns what was copied.
 */
export function sendToAiMode(
  prefix: string,
  source: string,
  io: AiModeIo = browserIo,
): string {
  const payload = buildPayload(prefix, source);
  io.copy(payload);
  io.open(AI_MODE_URL);
  return payload;
}
