// Renders sanitized HTML returned by the engine (PRD §9 D16).
//
// Trust boundary: the engine sanitizes; TII does NOT re-sanitize.
// This component is the ONE site where dangerouslySetInnerHTML is
// used. Do not introduce a second.
//
// The wrapping div carries data-text-origin="canonical" so every
// descendant text node inherits canonical provenance unless the
// engine markup overrides it (e.g., AI-marginalia spans inside the
// body would set their own data-text-origin="generated").

export function CanonicalBody({ html }: { html: string }) {
  return (
    <div
      className="attn-body"
      data-text-origin="canonical"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
