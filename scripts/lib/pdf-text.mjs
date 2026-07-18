// PDF text extraction with no third-party dependency.
//
// Shared by scripts/verify-print.mjs (the resume we generate) and
// scripts/verify-source-fidelity.mjs (the resume PDF we transcribed from).
// The project forbids new dependencies, so this reads the PDF structure
// directly and decodes text through each font's /ToUnicode CMap.
//
// That CMap step is not optional. PDF producers write text as FONT-SUBSET
// GLYPH IDS, not characters: Chrome emits `<1E> Tj`, and the source resume
// emits `<0045> Tj`. Skip the CMap and you get an empty string — which would
// make every "no email appears in this PDF" assertion pass vacuously. Callers
// are expected to assert on `fontsDecoded` and text length for that reason.
//
// Two details that are easy to get wrong, and were:
//
//   1. Font resource names are PAGE-SCOPED. /F4 on page 1 and /F4 on page 2
//      routinely reference different font objects. A single global name->font
//      map silently decodes one page with the other's alphabet. The source
//      resume has 33 font objects behind 11 reused names.
//
//   2. Glyph codes are not always one byte. A Type0/Identity-H font uses
//      two-byte codes, so `<0045>` is ONE glyph (0x0045), not two (0x00,0x45).
//      Splitting it into bytes appears to work — every code below 256 still
//      lands on the right character — and then quietly loses exactly the
//      glyphs with higher ids, which is where ligatures and typographic
//      punctuation live. Code width is taken from the CMap's codespacerange.

import { inflateSync } from "node:zlib";

/** Parse `N 0 obj ... endobj` spans into { dict, streamText }. */
export function parsePdfObjects(buf) {
  const raw = buf.toString("latin1");
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
        const slice = buf.subarray(s, e);
        try {
          streamText = inflateSync(slice).toString("latin1");
        } catch {
          streamText = slice.toString("latin1");
        }
      }
    }
    objects.set(Number(m[1]), {
      dict: si === -1 ? body : body.slice(0, si),
      streamText,
    });
  }
  return { objects, raw };
}

/**
 * Decode a /ToUnicode CMap.
 *
 * Returns the code->string map plus `hexDigits`, the number of hex digits one
 * glyph code occupies (2 for single-byte fonts, 4 for Identity-H).
 */
export function parseCMap(text) {
  const map = new Map();

  const hexToStr = (h) => {
    let out = "";
    for (let i = 0; i + 4 <= h.length; i += 4) {
      const code = parseInt(h.slice(i, i + 4), 16);
      // 0xFFFE/0xFFFF are non-characters; 0 is the CMap's "unmapped" filler.
      if (code && code !== 0xfffe && code !== 0xffff)
        out += String.fromCharCode(code);
    }
    return out;
  };

  // Prefer the declared codespace; fall back to the widest key seen.
  let hexDigits = 0;
  for (const block of text.matchAll(
    /begincodespacerange([\s\S]*?)endcodespacerange/g,
  )) {
    for (const p of block[1].matchAll(/<([0-9A-Fa-f]+)>/g)) {
      hexDigits = Math.max(hexDigits, p[1].length);
    }
  }

  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const p of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>/g)) {
      if (!hexDigits) hexDigits = p[1].length;
      map.set(parseInt(p[1], 16), hexToStr(p[2]));
    }
  }
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    // <lo> <hi> <dstBase>
    for (const p of block[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
    )) {
      if (!hexDigits) hexDigits = p[1].length;
      const lo = parseInt(p[1], 16);
      const hi = parseInt(p[2], 16);
      const dst = p[3];
      // Only the final code unit increments across the range.
      const prefix = dst.slice(0, Math.max(0, dst.length - 4));
      const base = parseInt(dst.slice(-4), 16);
      for (let c = lo; c <= hi && c - lo < 65536; c++) {
        map.set(
          c,
          hexToStr(prefix + (base + (c - lo)).toString(16).padStart(4, "0")),
        );
      }
    }
    // <lo> <hi> [ <dst> <dst> ... ]
    for (const p of block[1].matchAll(
      /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g,
    )) {
      if (!hexDigits) hexDigits = p[1].length;
      const lo = parseInt(p[1], 16);
      const dsts = [...p[3].matchAll(/<([0-9A-Fa-f]*)>/g)].map((d) => d[1]);
      dsts.forEach((d, i) => map.set(lo + i, hexToStr(d)));
    }
  }

  return { map, hexDigits: hexDigits || 2 };
}

/** Resolve `<< ... >>` or `N 0 R` into dictionary text. */
function resolveDict(value, objects) {
  const ref = value.match(/^\s*(\d+)\s+0\s+R/);
  if (ref) return objects.get(Number(ref[1]))?.dict ?? "";
  return value;
}

/** Extract a balanced `/Key << ... >>` body, honouring nesting. */
function dictEntry(dict, key) {
  const at = dict.indexOf(`/${key}`);
  if (at === -1) return "";
  const rest = dict.slice(at + key.length + 1);
  const open = rest.indexOf("<<");
  const ref = rest.match(/^\s*(\d+)\s+0\s+R/);
  if (ref && (open === -1 || rest.indexOf(ref[0]) < open)) return ref[0];
  if (open === -1) return "";
  let depth = 0;
  for (let i = open; i < rest.length - 1; i++) {
    if (rest[i] === "<" && rest[i + 1] === "<") {
      depth++;
      i++;
    } else if (rest[i] === ">" && rest[i + 1] === ">") {
      depth--;
      i++;
      if (depth === 0) return rest.slice(open, i + 1);
    }
  }
  return "";
}

/** Build resource-name -> decoded CMap for one page's /Resources. */
function fontsForResources(resourcesDict, objects, cache) {
  const fontDict = dictEntry(resourcesDict, "Font");
  const resolved = resolveDict(fontDict, objects);
  const fonts = new Map();
  for (const e of resolved.matchAll(/\/([A-Za-z0-9_.+-]+)\s+(\d+)\s+0\s+R/g)) {
    const objNum = Number(e[2]);
    if (!cache.has(objNum)) {
      const font = objects.get(objNum);
      let decoded = null;
      if (font) {
        const tu = font.dict.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
        const cmap = tu && objects.get(Number(tu[1]))?.streamText;
        if (cmap) decoded = parseCMap(cmap);
      }
      cache.set(objNum, decoded);
    }
    const decoded = cache.get(objNum);
    if (decoded) fonts.set(e[1], decoded);
  }
  return fonts;
}

/** Collect a page's content streams, following /Contents refs and arrays. */
function contentsForPage(pageDict, objects) {
  const at = pageDict.indexOf("/Contents");
  if (at === -1) return [];
  const rest = pageDict.slice(at + 9);
  const single = rest.match(/^\s*(\d+)\s+0\s+R/);
  if (single)
    return [objects.get(Number(single[1]))?.streamText].filter(Boolean);
  const arr = rest.match(/^\s*\[([\s\S]*?)\]/);
  if (!arr) return [];
  return [...arr[1].matchAll(/(\d+)\s+0\s+R/g)]
    .map((m) => objects.get(Number(m[1]))?.streamText)
    .filter(Boolean);
}

// Newlines come from T* and ET only. NOT from Td/TD: Chrome positions every
// individual glyph with its own Td, so treating those as line breaks shreds
// the text into one character per line — which still looks like a successful
// extraction by character count while making every substring search fail.
// Word separation comes from the documents' own space glyphs.
const TOKENS =
  /\/([A-Za-z0-9_.+-]+)\s+[\d.-]+\s+Tf|<([0-9A-Fa-f]*)>\s*Tj|\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|')|\[((?:[^\][\\]|\\.)*)\]\s*TJ|\bT\*|\bET\b/g;

function decodeHex(hex, font) {
  const step = font?.hexDigits ?? 2;
  let out = "";
  for (let i = 0; i + step <= hex.length; i += step) {
    const code = parseInt(hex.slice(i, i + step), 16);
    out += font?.map.get(code) ?? "";
  }
  return out;
}

const unescapeLiteral = (s) =>
  s
    .replace(
      /\\([nrtbf])/g,
      (_, c) => ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" })[c],
    )
    .replace(/\\([0-7]{1,3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\(.)/g, "$1");

function decodeStream(stream, fonts) {
  let out = "";
  let font = null;
  for (const m of stream.matchAll(TOKENS)) {
    if (m[1] !== undefined) {
      font = fonts.get(m[1]) ?? null;
    } else if (m[2] !== undefined) {
      out += decodeHex(m[2], font);
    } else if (m[3] !== undefined) {
      out += unescapeLiteral(m[3]);
    } else if (m[4] !== undefined) {
      for (const p of m[4].matchAll(
        /<([0-9A-Fa-f]*)>|\(((?:[^()\\]|\\.)*)\)/g,
      )) {
        if (p[1] !== undefined) out += decodeHex(p[1], font);
        else out += unescapeLiteral(p[2]);
      }
    } else {
      out += "\n";
    }
  }
  return out;
}

/**
 * Extract all text from a PDF buffer.
 *
 * Returns { text, fontsDecoded, pages, unmappedGlyphs } — callers should treat
 * a zero `fontsDecoded` or a suspiciously short `text` as a harness failure
 * rather than as evidence about the document's contents.
 */
export function extractPdfText(buf) {
  const { objects } = parsePdfObjects(buf);
  const cache = new Map();
  let text = "";
  let pages = 0;

  for (const [, obj] of objects) {
    if (!/\/Type\s*\/Page[^s]/.test(obj.dict)) continue;
    pages++;
    const resources = resolveDict(dictEntry(obj.dict, "Resources"), objects);
    const fonts = fontsForResources(resources, objects, cache);
    for (const stream of contentsForPage(obj.dict, objects)) {
      text += decodeStream(stream, fonts) + "\n";
    }
  }

  // Producers that inline everything (or that we failed to page-walk) still
  // deserve a decode: fall back to every content-bearing stream, using every
  // font we can see. Only used when the page walk yielded nothing.
  if (!text.trim()) {
    const fonts = new Map();
    for (const [, obj] of objects) {
      for (const fd of obj.dict.matchAll(/\/Font\s*<<([\s\S]*?)>>/g)) {
        for (const e of fd[1].matchAll(
          /\/([A-Za-z0-9_.+-]+)\s+(\d+)\s+0\s+R/g,
        )) {
          const font = objects.get(Number(e[2]));
          const tu = font?.dict.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
          const cmap = tu && objects.get(Number(tu[1]))?.streamText;
          if (cmap) fonts.set(e[1], parseCMap(cmap));
        }
      }
    }
    for (const [, obj] of objects) {
      if (obj.streamText && /\bTj\b|\bTJ\b/.test(obj.streamText)) {
        text += decodeStream(obj.streamText, fonts) + "\n";
      }
    }
    return { text, fontsDecoded: fonts.size, pages };
  }

  const fontsDecoded = [...cache.values()].filter(Boolean).length;
  return { text, fontsDecoded, pages };
}

/** Page count from the page tree, with a /Type /Page fallback. */
export function pdfPageCount(raw) {
  const counts = [...raw.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  if (counts.length) return Math.max(...counts);
  return (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
}

/** Distinct /MediaBox rectangles, as [x0,y0,x1,y1] tuples. */
export function pdfMediaBoxes(raw) {
  return [...raw.matchAll(/\/MediaBox\s*\[\s*([\d.\s-]+?)\]/g)].map((m) =>
    m[1].trim().split(/\s+/).map(Number),
  );
}
