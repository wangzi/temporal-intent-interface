// Types for the dependency-free PDF text extractor in ./pdf-text.mjs.
// The implementation stays plain JS because the verify scripts run under bare
// node, with no build step.

export interface PdfObject {
  /** The object's dictionary text, up to `stream` if it has one. */
  dict: string;
  /** Inflated stream contents, or null when the object carries no stream. */
  streamText: string | null;
}

export interface ParsedPdf {
  objects: Map<number, PdfObject>;
  /** The whole file as latin1, for structural regex reads. */
  raw: string;
}

export interface DecodedCMap {
  /** Glyph code -> the character(s) it represents. */
  map: Map<number, string>;
  /** Hex digits per glyph code: 2 for single-byte fonts, 4 for Identity-H. */
  hexDigits: number;
}

export interface ExtractedPdfText {
  text: string;
  /**
   * Number of fonts whose /ToUnicode CMap was decoded. Zero means the text is
   * empty for harness reasons, not document reasons — assert on it before
   * concluding anything from `text`.
   */
  fontsDecoded: number;
  pages: number;
}

export declare function parsePdfObjects(buf: Buffer): ParsedPdf;
export declare function parseCMap(text: string): DecodedCMap;
export declare function extractPdfText(buf: Buffer): ExtractedPdfText;
export declare function pdfPageCount(raw: string): number;
export declare function pdfMediaBoxes(raw: string): number[][];
