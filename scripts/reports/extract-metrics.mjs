// Diagnostic only (Phase 1c): extract Lighthouse metrics from ./reports/*.report.json
// into a table + reports/metrics-summary.json. No app code touched.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const REPORTS = [
  ["home-mobile", "reports/lh-home-mobile.report.json"],
  ["home-desktop", "reports/lh-home-desktop.report.json"],
  ["post-mobile", "reports/lh-post-mobile.report.json"],
  ["post-desktop", "reports/lh-post-desktop.report.json"],
  ["local-home", "reports/lh-local-home.report.json"],
  ["local-post", "reports/lh-local-post.report.json"],
];

const num = (v) => (typeof v === "number" ? v : null);
const ms = (v) => (v == null ? null : Math.round(v));
const kb = (b) => (b == null ? null : Math.round((b / 1024) * 10) / 10);

function resourceBytes(lhr) {
  // resource-summary: per-type transferSize + requestCount
  const items = lhr.audits?.["resource-summary"]?.details?.items ?? [];
  const byType = {};
  for (const it of items) byType[it.resourceType] = it;
  return {
    totalTransfer: byType.total?.transferSize ?? lhr.audits?.["total-byte-weight"]?.numericValue ?? null,
    jsTransfer: byType.script?.transferSize ?? null,
    cssTransfer: byType.stylesheet?.transferSize ?? null,
    jsCount: byType.script?.requestCount ?? null,
  };
}

const out = {};
for (const [key, path] of REPORTS) {
  if (!existsSync(path)) { out[key] = { available: false, reason: "report missing" }; continue; }
  const lhr = JSON.parse(readFileSync(path, "utf8"));
  const a = lhr.audits ?? {};
  const rb = resourceBytes(lhr);
  // field INP only present via CrUX (loadingExperience) — local LH has none
  const fieldInp = lhr?.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile ?? null;
  out[key] = {
    available: true,
    finalUrl: lhr.finalDisplayedUrl ?? lhr.finalUrl,
    formFactor: lhr.configSettings?.formFactor,
    perfScore: num(lhr.categories?.performance?.score) != null ? Math.round(lhr.categories.performance.score * 100) : null,
    LCP_ms: ms(num(a["largest-contentful-paint"]?.numericValue)),
    CLS: num(a["cumulative-layout-shift"]?.numericValue),
    fieldINP_ms: fieldInp,
    TBT_ms: ms(num(a["total-blocking-time"]?.numericValue)),
    FCP_ms: ms(num(a["first-contentful-paint"]?.numericValue)),
    SpeedIndex_ms: ms(num(a["speed-index"]?.numericValue)),
    totalTransfer_kb: kb(rb.totalTransfer),
    totalJS_kb: kb(rb.jsTransfer),
    jsRequestCount: rb.jsCount,
    css_kb: kb(rb.cssTransfer),
    unusedJS_kb: kb(num(a["unused-javascript"]?.details?.overallSavingsBytes)),
    unusedCSS_kb: kb(num(a["unused-css-rules"]?.details?.overallSavingsBytes)),
    lhVersion: lhr.lighthouseVersion,
  };
}

writeFileSync("reports/metrics-summary.json", JSON.stringify(out, null, 2));

// Pretty table
const cols = ["perfScore","LCP_ms","CLS","fieldINP_ms","TBT_ms","FCP_ms","SpeedIndex_ms","totalTransfer_kb","totalJS_kb","unusedJS_kb","unusedCSS_kb"];
const pad = (s, n) => String(s ?? "—").padEnd(n);
console.log(pad("metric", 18) + REPORTS.map(([k]) => pad(k, 14)).join(""));
for (const c of cols) {
  console.log(pad(c, 18) + REPORTS.map(([k]) => pad(out[k]?.[c], 14)).join(""));
}
console.log("\nwrote reports/metrics-summary.json");
