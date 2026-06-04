// Diagnostic only (Phase 1e): capture TII reader screenshots at responsive
// breakpoints + a JavaScript-disabled pass, and report horizontal overflow.
// Uses playwright-core driving the locally-installed Chrome (channel: "chrome")
// so no browser binary is downloaded. Run against a local prod build:
//   pnpm build && (PORT=3000 pnpm start &) && npx tsx scripts/reports/capture-reader-screenshots.ts
import { chromium, type Browser } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const WIDTHS = [320, 390, 768, 1024, 1440];
const HEIGHT = 900;
const ROUTES: Array<{ name: string; path: string }> = [
  { name: "home", path: "/" },
  // local prod build runs in fixture mode → use a fixture post slug
  { name: "post", path: "/post/why-technology-still-needs-humanity" },
];

mkdirSync("reports/shots", { recursive: true });

async function overflow(page: import("playwright-core").Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

async function run() {
  const browser: Browser = await chromium.launch({ channel: "chrome", headless: true });
  const rows: string[] = [];
  // JS-ON passes at every width
  for (const r of ROUTES) {
    for (const w of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: HEIGHT }, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      const ox = await overflow(page);
      await page.screenshot({ path: `reports/shots/${r.name}-${w}.png` });
      rows.push(`JS  ${r.name.padEnd(5)} ${String(w).padEnd(5)} overflowPx=${ox}`);
      await ctx.close();
    }
  }
  // JS-OFF passes (content must remain visible)
  for (const r of ROUTES) {
    for (const w of [390, 1024]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: HEIGHT }, javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(`${BASE}${r.path}`, { waitUntil: "load" });
      const ox = await overflow(page);
      await page.screenshot({ path: `reports/shots/nojs-${r.name}-${w}.png` });
      rows.push(`NOJS ${r.name.padEnd(5)} ${String(w).padEnd(5)} overflowPx=${ox}`);
      await ctx.close();
    }
  }
  await browser.close();
  console.log(rows.join("\n"));
}
run().catch((e) => { console.error("capture failed:", e.message); process.exit(1); });
