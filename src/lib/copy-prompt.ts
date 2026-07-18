// Client-side prompt template + clipboard copy.
// PRD §17.29: Copy Prompt is client-side and NEVER fails — no network
// dependency, and the prompt is always retrievable even if both
// clipboard write paths fail (the caller surfaces a fallback dialog).
//
// Pure helpers (no React) so they can be unit-tested directly and reused by
// other clients.

export type PostForPrompt = {
  title: string;
  intent_label: string;
  intent_statement: string;
};

export function buildPrompt(post: PostForPrompt, selection: string): string {
  const trimmed = selection.trim();
  const quoted = trimmed
    .split(/\r?\n/)
    .map((line) => (line.length === 0 ? ">" : `> ${line}`))
    .join("\n");

  return `Read this passage from "${post.title}" (intent: ${post.intent_label} — ${post.intent_statement}):

${quoted}

Help me think with it.`;
}

/**
 * Two-step clipboard write with a graceful fallback. Returns whether
 * the browser confirmed the write. The caller is responsible for
 * surfacing the text manually (via a dialog) when this returns false.
 *
 * Never throws.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Preferred: navigator.clipboard.writeText (https + user gesture).
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through
    }
  }

  // Fallback: hidden textarea + document.execCommand('copy').
  if (typeof document !== "undefined") {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText =
        "position:fixed;top:-9999px;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      // fall through
    }
  }

  return false;
}
