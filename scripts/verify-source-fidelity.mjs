// Proves that every public claim in src/lib/resume/data.ts appears verbatim in
// the source resume PDF.
//
// This is the project's hardest locked constraint — no embellishing, no
// inferring, no normalizing away meaning, "Present" stays "Present" — and
// until now it was only ever checked by hand, in scratch files, once. A future
// edit to the resume had no way to reproduce the check. Now it is `pnpm
// verify:source`.
//
//   RESUME_SOURCE_PDF='/path/to/resume.pdf' pnpm verify:source
//
// The PDF is private (it carries an email and phone that must never ship), so
// its path is supplied by the operator and never committed, and this script
// prints only counts, the file hash, and unmatched strings — all of which come
// from data.ts, which is public by construction.
//
// data.ts is read through the TypeScript compiler API rather than by regex:
// the point is to enumerate exactly the natural-language fields, and a regex
// over string literals cannot tell an organization name from an id, a URL or
// a hash. (The earlier scratch check did use a regex, filtered to "contains a
// space and is longer than 8 characters", and thereby skipped "Google",
// "Android", "Chrome" and "Zi Wang" without anyone noticing. Its reported
// 49/49 was really 49 of 51.)

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import ts from "typescript";

import { extractPdfText } from "./lib/pdf-text.mjs";

const DATA_FILE = "src/lib/resume/data.ts";

// Pinned so that ADDING or REMOVING resume content is a deliberate act: the
// counts change, this fails, and whoever changed the record has to re-run the
// comparison against the source document rather than silently widening it.
const EXPECTED_OCCURRENCES = 54;
const EXPECTED_DISTINCT = 51;

// Natural language only. Everything else in the record is machine plumbing.
const NATURAL_LANGUAGE_KEYS = new Set([
  "name",
  "headline",
  "summary",
  "location",
  "organization",
  "role",
  "team",
  "text",
  "institution",
  "credential",
]);

// Deliberately NOT compared: ids are kebab-case handles, `years` and
// start/endYear are dates rendered differently by the PDF's layout, `linkedin`
// is a URL, `version`/`canonical` are ours, and `sourceSha256` is this file's
// own subject rather than a claim.
const NON_CLAIM_KEYS = new Set([
  "id",
  "version",
  "canonical",
  "linkedin",
  "sourceSha256",
  "years",
  "startYear",
  "endYear",
]);

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ── normalization ──────────────────────────────────────────────────────────
//
// Narrow on purpose. Only three classes of difference are forgiven, each one a
// property of how PDFs are typeset rather than a difference in wording:
//
//   1. Ligatures. The source sets fi/ffi as single glyphs (U+FB00-04).
//   2. Unicode punctuation with an ASCII equivalent (dashes, curly quotes).
//   3. Whitespace, including the extractor's kerning artifacts — the source
//      decodes "commercialized" as "commer cializ ed".
//
// Digits, letters, currency symbols, plus signs, units and all other
// punctuation are compared as-is. Rounding "$980K+" to "$1M" must fail, and
// the negative controls below prove it does.

const LIGATURES = { ﬀ: "ff", ﬁ: "fi", ﬂ: "fl", ﬃ: "ffi", ﬄ: "ffl" };

function normalize(value) {
  return value
    .replace(/[ﬀ-ﬄ]/g, (c) => LIGATURES[c])
    .replace(/[‐-―−]/g, "-")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/\s+/g, "");
}

// ── read the record through the TypeScript AST ─────────────────────────────
function readResumeStrings(file) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );

  let declaration = null;
  (function findResumeInput(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "resumeInput"
    ) {
      declaration = node;
    }
    node.forEachChild(findResumeInput);
  })(source);

  if (!declaration?.initializer) {
    throw new Error(`could not locate \`resumeInput\` in ${file}`);
  }

  const strings = [];
  let sourceSha256 = null;

  (function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const key =
        ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)
          ? node.name.text
          : null;

      if (key === "sourceSha256" && ts.isStringLiteral(node.initializer)) {
        sourceSha256 = node.initializer.text;
      }

      if (key && NATURAL_LANGUAGE_KEYS.has(key)) {
        const collect = (init) => {
          if (
            ts.isStringLiteral(init) ||
            ts.isNoSubstitutionTemplateLiteral(init)
          ) {
            strings.push({ key, value: init.text });
          }
        };
        if (ts.isArrayLiteralExpression(node.initializer)) {
          node.initializer.elements.forEach(collect);
        } else {
          collect(node.initializer);
        }
      }

      if (key && NON_CLAIM_KEYS.has(key)) return;
    }
    node.forEachChild(visit);
  })(declaration.initializer);

  return { strings, sourceSha256 };
}

// ── run ────────────────────────────────────────────────────────────────────
const pdfPath = process.env.RESUME_SOURCE_PDF;
if (!pdfPath) {
  console.error(
    "verify-source: RESUME_SOURCE_PDF is not set.\n" +
      "The source resume is private and is never committed, so its path must be\n" +
      "supplied explicitly:\n\n" +
      "  RESUME_SOURCE_PDF='/path/to/Resume.pdf' pnpm verify:source\n",
  );
  process.exit(2);
}

let pdfBuffer;
try {
  pdfBuffer = readFileSync(pdfPath);
} catch {
  console.error(`verify-source: cannot read RESUME_SOURCE_PDF at ${pdfPath}`);
  process.exit(2);
}

const { strings, sourceSha256 } = readResumeStrings(DATA_FILE);
const actualSha = createHash("sha256").update(pdfBuffer).digest("hex");

check(
  Boolean(sourceSha256),
  `${DATA_FILE} declares no sourceSha256 to verify against`,
);
check(
  actualSha === sourceSha256,
  `source PDF hash ${actualSha} does not match sourceSha256 ${sourceSha256} — ` +
    "this is a different document than the record was transcribed from",
);

const extracted = extractPdfText(pdfBuffer);
const haystack = normalize(extracted.text);

// Non-vacuity. An empty or near-empty extraction would make every comparison
// below fail loudly rather than silently pass, but these say so directly.
check(
  extracted.fontsDecoded > 0,
  "decoded no font CMaps — text comparison would be meaningless",
);
check(
  extracted.text.length > 4000,
  `extracted only ${extracted.text.length} chars — text comparison would be unreliable`,
);

const distinct = [...new Set(strings.map((s) => s.value))];
const unmatched = distinct.filter((v) => !haystack.includes(normalize(v)));

check(
  strings.length === EXPECTED_OCCURRENCES,
  `expected ${EXPECTED_OCCURRENCES} natural-language strings in ${DATA_FILE}, found ${strings.length}`,
);
check(
  distinct.length === EXPECTED_DISTINCT,
  `expected ${EXPECTED_DISTINCT} distinct natural-language strings, found ${distinct.length}`,
);
check(
  unmatched.length === 0,
  `${unmatched.length} string(s) in ${DATA_FILE} do not appear in the source PDF`,
);

// ── negative controls ──────────────────────────────────────────────────────
// A comparison that cannot fail is not a comparison. These mutate the record
// in memory and require the check to reject it.
const negativeControls = [];

// 1. A changed metric must not match.
const metricClaim = distinct.find((v) => v.includes("$980K+"));
negativeControls.push({
  name: "changed metric is rejected",
  passed:
    Boolean(metricClaim) &&
    !haystack.includes(normalize(metricClaim.replace("$980K+", "$981K+"))),
});

// 2. A changed ordinary word must not match. Chosen to contain no ligature
//    pair, so it cannot be masked by the ligature normalization above.
const wordClaim = distinct.find((v) => v.includes("laser headphones"));
negativeControls.push({
  name: "changed ordinary word is rejected",
  passed:
    Boolean(wordClaim) &&
    !haystack.includes(
      normalize(wordClaim.replace("laser headphones", "lazer headphones")),
    ),
});

// 3. A changed expected hash must not match.
negativeControls.push({
  name: "changed source hash is rejected",
  passed: actualSha !== `0${sourceSha256?.slice(1)}`,
});

// 4. Text absent from the source must not match, so `includes` is not trivially true.
negativeControls.push({
  name: "absent sentence is rejected",
  passed: !haystack.includes(normalize("Certified underwater basket weaver")),
});

const negativeControlsPassed = negativeControls.every((c) => c.passed);
check(
  negativeControlsPassed,
  `negative controls failed: ${negativeControls
    .filter((c) => !c.passed)
    .map((c) => c.name)
    .join(", ")}`,
);

// Only public values are ever printed: counts, the file hash, and strings that
// came from data.ts. The PDF's own text is never echoed.
console.log(
  JSON.stringify(
    {
      sourceSha256: actualSha,
      fontsDecoded: extracted.fontsDecoded,
      pages: extracted.pages,
      extractedChars: extracted.text.length,
      stringsExpected: EXPECTED_DISTINCT,
      stringsChecked: strings.length,
      stringsMatched: distinct.length - unmatched.length,
      stringsUnmatched: unmatched.length,
      unmatchedStrings: unmatched.map((s) => s.slice(0, 120)),
      negativeControls,
      negativeControlsPassed,
      failures,
    },
    null,
    2,
  ),
);

if (failures.length) {
  console.error(`\nverify-source: ${failures.length} failure(s)`);
  process.exit(1);
}
console.error("verify-source: OK");
