// Renders a JSON-LD <script> block.
//
// This is the SECOND and only other approved `dangerouslySetInnerHTML` seam in
// the codebase (the first is CanonicalBody, which renders engine-sanitized post
// HTML). It exists because a JSON-LD payload must be emitted as raw script text
// — React would otherwise escape it into invalid JSON — and it is narrowly
// scoped so that stays true:
//
//   - It accepts a plain object, never a string, so no caller can hand it markup.
//   - It serializes with JSON.stringify and escapes "<" to <, which closes
//     the only injection route that matters here: a value containing
//     "</script>" breaking out of the block.
//
// Do not widen this component, and do not introduce a third such seam.

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
