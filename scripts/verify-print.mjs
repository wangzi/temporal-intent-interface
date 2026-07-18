// Verifies the printed resume as a distribution artifact.
//
// The PDF is what a reader attaches to an application, so a print regression
// is a shipping defect — and an invisible one, because nothing on screen
// changes. This generates the PDF and asserts the properties that matter:
// exactly two US Letter pages, every employer and school present, no
// interactive chrome, and no contact details.
//
//   BASE_URL=http://127.0.0.1:3100 node scripts/verify-print.mjs
//
// No PDF library: the project forbids new dependencies, so page geometry is
// read from the PDF structure and text is decoded by running the content
// streams back through each font's /ToUnicode CMap. Chrome writes text as
// subset glyph ids, so without that step the extracted text is empty — and an
// empty extraction would make every "no email found" check pass vacuously.

import { readFileSync, writeFileSync } from "node:fs";

import { chromium } from "playwright-core";

import {
  extractPdfText,
  pdfMediaBoxes,
  pdfPageCount,
} from "./lib/pdf-text.mjs";
import { resumeAccessCookies } from "./lib/resume-gate.mjs";

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3100";
const OUT = process.env.PDF_OUT ?? "/tmp/tii-resume.pdf";

const EMPLOYERS = [
  "Timeless Wallet",
  "Timeless Calendar",
  "Glow Headphones",
  "Google",
];
const SCHOOLS = ["Wharton", "Stanford", "Georgia State"];
const CHROME = [
  "Ask AI",
  "Interrogate this resume",
  "Read as",
  "Full record",
  "zw@z",
];
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g;

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// ── generate ───────────────────────────────────────────────────────────────
const browser = await chromium.launch({ channel: "chrome" });
// Past the pre-publication gate, or this would print the unlock curtain.
const accessCookies = await resumeAccessCookies(BASE_URL, browser);
const context = await browser.newContext();
if (accessCookies.length) await context.addCookies(accessCookies);
const page = await context.newPage();
await page.goto(`${BASE_URL}/resume`, { waitUntil: "networkidle" });
await page.emulateMedia({ media: "print" });

const inPrint = await page.evaluate(() => {
  const visible = (sel) =>
    Array.from(document.querySelectorAll(sel)).some(
      (el) => getComputedStyle(el).display !== "none",
    );
  return {
    roleNav: visible(".resume-roles"),
    askAi: visible(".ask-ai-dot"),
    footer: visible("footer"),
    claims: document.querySelectorAll("[data-claim-id]").length,
  };
});

await page.pdf({ path: OUT, format: "Letter", printBackground: false });
await browser.close();

check(!inPrint.roleNav, "role nav is visible in print media");
check(!inPrint.askAi, "Ask AI control is visible in print media");
check(!inPrint.footer, "site footer is visible in print media");
check(
  inPrint.claims === 26,
  `expected 26 claims in print, saw ${inPrint.claims}`,
);

// ── geometry ───────────────────────────────────────────────────────────────
const buf = readFileSync(OUT);
const raw = buf.toString("latin1");

const pageCount = pdfPageCount(raw);
const boxes = pdfMediaBoxes(raw);
const isLetter = (b) =>
  Math.abs(b[2] - b[0] - 612) < 1.5 && Math.abs(b[3] - b[1] - 792) < 1.5;

check(pageCount === 2, `expected exactly 2 pages, found ${pageCount}`);
check(boxes.length > 0, "no /MediaBox found — could not verify page size");
check(
  boxes.every(isLetter),
  `page size is not US Letter: ${JSON.stringify(boxes)}`,
);

// ── text ───────────────────────────────────────────────────────────────────
const extracted = extractPdfText(buf);
const text = extracted.text;
const fontsDecoded = extracted.fontsDecoded;
const flat = text.replace(/\s+/g, " ");
writeFileSync("/tmp/tii-resume-extracted.txt", text);

// Guard against the whole text section passing vacuously on an empty extract.
check(
  fontsDecoded > 0,
  "decoded no font CMaps — text assertions would be vacuous",
);
check(
  flat.length > 4000,
  `extracted only ${flat.length} chars — text assertions would be unreliable`,
);
check(flat.includes("Zi Wang"), "name missing from PDF text");
for (const e of EMPLOYERS)
  check(flat.includes(e), `employer missing from PDF: ${e}`);
for (const s of SCHOOLS)
  check(flat.includes(s), `school missing from PDF: ${s}`);
for (const c of CHROME)
  check(!flat.includes(c), `interactive chrome leaked into PDF: ${c}`);
check(flat.includes("Present"), '"Present" was not preserved in the PDF');
check(flat.includes("linkedin.com/in/wzi"), "LinkedIn URL not printed");

const emails = flat.match(EMAIL) ?? [];
const phones = flat.match(PHONE) ?? [];
check(emails.length === 0, `email found in PDF: ${emails.join(", ")}`);
check(
  phones.length === 0,
  `phone-shaped string found in PDF: ${phones.join(", ")}`,
);

// ── report ─────────────────────────────────────────────────────────────────
console.log(
  JSON.stringify(
    {
      out: OUT,
      bytes: buf.length,
      pages: pageCount,
      pageSize: [...new Set(boxes.map((b) => b.join("x")))],
      allUsLetter: boxes.every(isLetter),
      printMedia: inPrint,
      fontsDecoded,
      extractedChars: flat.length,
      emails,
      phoneShaped: phones,
      failures,
    },
    null,
    2,
  ),
);

if (failures.length) {
  console.error(`\nverify-print: ${failures.length} failure(s)`);
  process.exit(1);
}
console.error("verify-print: OK");
