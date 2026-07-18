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
import { inflateSync } from "node:zlib";

import { chromium } from "playwright-core";

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
const page = await browser.newPage();
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

const counts = [...raw.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
const pageCount = counts.length ? Math.max(...counts) : 0;
const boxes = [...raw.matchAll(/\/MediaBox\s*\[\s*([\d.\s-]+?)\]/g)].map((m) =>
  m[1].trim().split(/\s+/).map(Number),
);
const isLetter = (b) =>
  Math.abs(b[2] - b[0] - 612) < 1.5 && Math.abs(b[3] - b[1] - 792) < 1.5;

check(pageCount === 2, `expected exactly 2 pages, found ${pageCount}`);
check(boxes.length > 0, "no /MediaBox found — could not verify page size");
check(
  boxes.every(isLetter),
  `page size is not US Letter: ${JSON.stringify(boxes)}`,
);

// ── text ───────────────────────────────────────────────────────────────────
const objects = new Map();
for (const m of raw.matchAll(/(\d+)\s+0\s+obj\b/g)) {
  const start = m.index + m[0].length;
  const end = raw.indexOf("endobj", start);
  if (end === -1) continue;
  const body = raw.slice(start, end);
  const si = body.indexOf("stream");
  let streamText = null;
  if (si !== -1) {
    let s = start + si + 6;
    if (buf[s] === 0x0d) s++;
    if (buf[s] === 0x0a) s++;
    const e = raw.indexOf("endstream", s);
    if (e !== -1) {
      try {
        streamText = inflateSync(buf.subarray(s, e)).toString("latin1");
      } catch {
        streamText = buf.subarray(s, e).toString("latin1");
      }
    }
  }
  objects.set(Number(m[1]), {
    dict: si === -1 ? body : body.slice(0, si),
    streamText,
  });
}

function parseCMap(text) {
  const map = new Map();
  const hexToStr = (h) => {
    let out = "";
    for (let i = 0; i + 4 <= h.length; i += 4) {
      const code = parseInt(h.slice(i, i + 4), 16);
      if (!Number.isNaN(code) && code !== 0) out += String.fromCharCode(code);
    }
    return out;
  };
  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const p of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      map.set(parseInt(p[1], 16), hexToStr(p[2]));
    }
  }
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const p of block[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
    )) {
      const lo = parseInt(p[1], 16);
      const hi = parseInt(p[2], 16);
      const base = parseInt(p[3], 16);
      for (let c = lo; c <= hi && c - lo < 65536; c++) {
        map.set(c, String.fromCharCode(base + (c - lo)));
      }
    }
  }
  return map;
}

const nameToObj = new Map();
for (const [, obj] of objects) {
  for (const fd of obj.dict.matchAll(/\/Font\s*<<([\s\S]*?)>>/g)) {
    for (const e of fd[1].matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)) {
      nameToObj.set(e[1], Number(e[2]));
    }
  }
}

const fontMaps = new Map();
for (const [name, objNum] of nameToObj) {
  const tu = objects.get(objNum)?.dict.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
  const cmap = tu && objects.get(Number(tu[1]))?.streamText;
  if (cmap) fontMaps.set(name, parseCMap(cmap));
}

let text = "";
for (const [, obj] of objects) {
  const s = obj.streamText;
  if (!s || !/\bTj\b|\bTJ\b/.test(s)) continue;
  let current = null;
  let lastY = null;
  for (const m of s.matchAll(
    /\/(F\d+)\s+[\d.]+\s+Tf|<([0-9A-Fa-f]*)>\s*Tj|1 0 0 -1 ([\d.-]+) ([\d.-]+) Tm/g,
  )) {
    if (m[1]) {
      current = fontMaps.get(m[1]) ?? null;
    } else if (m[4] !== undefined) {
      const y = Number(m[4]);
      if (lastY !== null && Math.abs(y - lastY) > 0.5) text += "\n";
      lastY = y;
    } else if (m[2] !== undefined && current) {
      for (let i = 0; i + 2 <= m[2].length; i += 2) {
        text += current.get(parseInt(m[2].slice(i, i + 2), 16)) ?? "";
      }
    }
  }
  text += "\n";
}

const flat = text.replace(/\s+/g, " ");
writeFileSync("/tmp/tii-resume-extracted.txt", text);

// Guard against the whole text section passing vacuously on an empty extract.
check(
  fontMaps.size > 0,
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
      fontsDecoded: fontMaps.size,
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
