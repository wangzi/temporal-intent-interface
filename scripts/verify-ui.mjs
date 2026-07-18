// Cross-surface UI regression harness.
//
// Drives a real Chrome over every route x viewport combination and asserts the
// invariants that keep breaking silently: horizontal overflow, console/page
// errors, design-token resolution, spine<->footer alignment, prose typography,
// the Escape rail-close, and canonical URLs.
//
// Parameterized on purpose — the same script runs against local dev, a Vercel
// preview, and production:
//
//   BASE_URL          where to point the browser      (default local dev)
//   CANONICAL_ORIGIN  what canonicals MUST resolve to (default production)
//   POST_SLUG         a post that exists at BASE_URL
//   SNAPSHOT_TOKEN    snapshot route token
//   OUT_DIR           machine-readable results + screenshots
//
// CANONICAL_ORIGIN is deliberately independent of BASE_URL: serving on
// 127.0.0.1 while NEXT_PUBLIC_SITE_URL is the production origin is exactly the
// case the previous harness got wrong (it compared against BASE_URL and
// reported two false canonical failures).
//
// Usage:  pnpm verify:ui
//         BASE_URL=https://z.stillinlove.co POST_SLUG=... pnpm verify:ui

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright-core";

import { resumeAccessCookies } from "./lib/resume-gate.mjs";

const BASE_URL = (process.env.BASE_URL ?? "http://127.0.0.1:3100").replace(
  /\/+$/,
  "",
);
const CANONICAL_ORIGIN = (
  process.env.CANONICAL_ORIGIN ?? "https://z.stillinlove.co"
).replace(/\/+$/, "");
const POST_SLUG = process.env.POST_SLUG ?? "a-journal-is-a-field-not-a-list";
const SNAPSHOT_TOKEN = process.env.SNAPSHOT_TOKEN ?? "audit-token";
const OUT_DIR = process.env.OUT_DIR ?? "reports";
const SHOTS_DIR = join(OUT_DIR, "verify-ui-shots");
// Optional: skip routes that don't exist on a given target (e.g. the snapshot
// route needs a fixture API; production has no audit-token).
const SKIP = new Set(
  (process.env.SKIP_ROUTES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

mkdirSync(SHOTS_DIR, { recursive: true });

/** name -> path. `expect404` marks the intentional 404 case. */
const ALL_ROUTES = [
  { name: "archive", path: "/", expect: 200 },
  { name: "post", path: `/post/${POST_SLUG}`, expect: 200 },
  { name: "snapshot", path: `/s/${SNAPSHOT_TOKEN}`, expect: 200 },
  { name: "resume", path: "/resume", expect: 200 },
  { name: "notfound", path: "/does-not-exist", expect: 404, expect404: true },
];
const ROUTES = ALL_ROUTES.filter((r) => !SKIP.has(r.name));

const WIDTHS = [390, 734, 1024, 1080, 1500, 1920, 2560];
const MATRIX = [
  ...WIDTHS.map((w) => ({ w, scheme: "light" })),
  ...[390, 1080].map((w) => ({ w, scheme: "dark" })),
];

const rows = [];
const failures = [];
const fail = (msg) => failures.push(msg);

/**
 * A 404 document legitimately makes Chrome log "Failed to load resource ... 404"
 * for the main request. Tolerated ONLY on the intentional 404 route; every other
 * console/page error is a real failure and is never suppressed.
 */
const isExpected404Noise = (route, text) =>
  route.expect404 && /Failed to load resource/i.test(text) && /404/.test(text);

const browser = await chromium.launch({ channel: "chrome", headless: true });

// The resume sits behind a pre-publication gate. Unlock once, then seed every
// context — otherwise the matrix would happily verify the unlock curtain and
// report /resume as green.
const accessCookies = await resumeAccessCookies(BASE_URL, browser);

for (const { w, scheme } of MATRIX) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: 900 },
    colorScheme: scheme,
    hasTouch: w === 390,
    deviceScaleFactor: 1,
  });

  if (accessCookies.length) await ctx.addCookies(accessCookies);

  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const errors = [];
    const cspViolations = [];
    page.on("console", (m) => {
      if (m.type() === "error" && !isExpected404Noise(route, m.text()))
        errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

    // CSP violations are reported by Chrome at console level `info`, not
    // `error`, so the filter above silently drops every one of them. The
    // policy also ships without report-uri/report-to, which means that without
    // this listener nothing anywhere observes a violation — and "we saw no
    // reports" would be evidence of nothing while still reading like a pass.
    // This matters most right before the report-only policy is promoted to
    // enforcing, when a missed violation becomes a hard block in production.
    await page.exposeFunction("__reportCsp", (v) => cspViolations.push(v));
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        window.__reportCsp?.(
          `${e.effectiveDirective} <- ${e.blockedURI || "(inline)"}`,
        );
      });
    });

    const resp = await page.goto(BASE_URL + route.path, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(150);

    const shot = join(SHOTS_DIR, `${route.name}-${w}-${scheme}.png`);
    await page.screenshot({ path: shot });

    const m = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const de = document.documentElement;
      return {
        overflow: de.scrollWidth - de.clientWidth,
        field: cs.getPropertyValue("--field").trim(),
        ink: cs.getPropertyValue("--ink").trim(),
        measure: cs.getPropertyValue("--measure").trim(),
        spineX: cs.getPropertyValue("--spine-x").trim(),
      };
    });

    const status = resp?.status() ?? null;
    rows.push({
      route: route.name,
      path: route.path,
      width: w,
      scheme,
      touch: w === 390,
      status,
      expected: route.expect,
      overflow: m.overflow,
      field: m.field,
      ink: m.ink,
      measure: m.measure,
      spineX: m.spineX,
      consoleErrors: errors.length,
      errorSample: errors.slice(0, 2),
      cspViolations: cspViolations.length,
      cspSample: cspViolations.slice(0, 3),
      shot,
    });

    const at = `${route.name}@${w}/${scheme}`;
    if (status !== route.expect)
      fail(`${at}: status ${status} !== expected ${route.expect}`);
    if (m.overflow > 0) fail(`${at}: horizontal overflow ${m.overflow}px`);
    if (errors.length) fail(`${at}: console error: ${errors[0]}`);
    if (cspViolations.length)
      fail(`${at}: CSP violation: ${cspViolations.join("; ")}`);
    if (!m.field || !m.ink || !m.measure)
      fail(`${at}: design tokens unresolved`);

    await page.close();
  }
  await ctx.close();
}

// ---------------------------------------------------------------- assertions
const assertions = {};
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  colorScheme: "light",
});
if (accessCookies.length) await ctx.addCookies(accessCookies);
const page = await ctx.newPage();

// Escape closes the CSS-only rail disclosure.
await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
await page.locator("label.rail-toggle").first().click();
await page.waitForTimeout(200);
const opened = await page.locator("#rail-toggle").isChecked();
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
const closed = await page.locator("#rail-toggle").isChecked();
assertions.escape = { opened, closed };
if (opened !== true) fail("rail did not open (checked !== true)");
if (closed !== false) fail("Escape did not close rail (checked !== false)");

// Spine <-> footer-prompt alignment.
async function alignment(path) {
  await page.goto(BASE_URL + path, { waitUntil: "networkidle" });
  return page.evaluate(() => {
    const spine =
      document.querySelector(".attn-inner .spine") ||
      document.querySelector(".spine");
    const cli = document.querySelector(".site-footer-cli");
    if (!spine || !cli) return { error: "missing element" };
    const s = spine.getBoundingClientRect().left;
    const c = cli.getBoundingClientRect().left;
    return {
      spineLeft: +s.toFixed(2),
      cliLeft: +c.toFixed(2),
      delta: +Math.abs(c - s).toFixed(2),
    };
  });
}
assertions.alignArchive = await alignment("/");
assertions.alignPost = await alignment(`/post/${POST_SLUG}`);
for (const [k, v] of Object.entries({
  archive: assertions.alignArchive,
  post: assertions.alignPost,
})) {
  if (v.error || v.delta > 1) fail(`alignment ${k}: ${JSON.stringify(v)}`);
}

// Post typography (still on the post page).
assertions.postTypography = await page.evaluate(() => {
  const p = document.querySelector(".attn-body p");
  if (!p) return { error: "no .attn-body p" };
  const cs = getComputedStyle(p);
  return {
    hasNewsreader: /Newsreader/i.test(cs.fontFamily),
    fontSize: cs.fontSize,
    maxWidth: cs.maxWidth,
  };
});
if (!assertions.postTypography.hasNewsreader)
  fail("post typography: Newsreader missing");
if (assertions.postTypography.fontSize !== "19px")
  fail(`post typography: ${assertions.postTypography.fontSize} !== 19px`);

// A bare .prose element outside the reader must get full typography.
assertions.standaloneProse = await page.evaluate(() => {
  const d = document.createElement("div");
  d.className = "prose";
  d.innerHTML =
    '<h2>H</h2><p>P</p><ul><li>L</li></ul><p><a href="#">a</a> <code>c</code></p>';
  document.body.appendChild(d);
  const g = (s) => getComputedStyle(d.querySelector(s));
  const out = {
    h2Font: g("h2").fontFamily.split(",")[0],
    pSize: g("p").fontSize,
    listStyleType: g("ul").listStyleType,
    aDecoration: g("a").textDecorationLine,
    codeFont: g("code").fontFamily.split(",")[0],
  };
  d.remove();
  return out;
});
if (assertions.standaloneProse.listStyleType === "none")
  fail("standalone prose: list marker is none");
if (!/Newsreader/i.test(assertions.standaloneProse.h2Font))
  fail("standalone prose: h2 not Newsreader");

// Footer: the arrow must hug its label with no whitespace text node.
assertions.footerLinkedIn = await page.evaluate(() => {
  const a = document.querySelector('a[href*="linkedin.com"]');
  if (!a) return { error: "no linkedin anchor" };
  const kids = [...a.childNodes];
  const i = kids.findIndex(
    (n) => n.nodeType === 1 && n.classList?.contains("site-footer-arrow"),
  );
  const prev = i > 0 ? kids[i - 1] : null;
  return {
    prevText: prev?.textContent ?? null,
    noTrailingSpace: prev?.nodeType === 3 && prev.textContent === "linkedin",
  };
});
if (!assertions.footerLinkedIn.noTrailingSpace)
  fail(
    `footer linkedin whitespace: ${JSON.stringify(assertions.footerLinkedIn)}`,
  );

// Canonicals — compared against CANONICAL_ORIGIN, never BASE_URL.
async function canonical(path) {
  await page.goto(BASE_URL + path, { waitUntil: "networkidle" });
  return page.evaluate(
    () =>
      document.querySelector('link[rel="canonical"]')?.getAttribute("href") ??
      null,
  );
}
assertions.canonicalArchive = await canonical("/");
assertions.canonicalPost = await canonical(`/post/${POST_SLUG}`);
if (assertions.canonicalArchive !== CANONICAL_ORIGIN)
  fail(
    `canonical archive ${assertions.canonicalArchive} !== ${CANONICAL_ORIGIN}`,
  );
if (assertions.canonicalPost !== `${CANONICAL_ORIGIN}/post/${POST_SLUG}`)
  fail(
    `canonical post ${assertions.canonicalPost} !== ${CANONICAL_ORIGIN}/post/${POST_SLUG}`,
  );

await ctx.close();
await browser.close();

const summary = {
  baseUrl: BASE_URL,
  canonicalOrigin: CANONICAL_ORIGIN,
  postSlug: POST_SLUG,
  routes: ROUTES.map((r) => r.name),
  rows: rows.length,
  failures: failures.length,
  statuses: Object.entries(
    rows.reduce((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {}),
  ).map(([status, count]) => ({ status: Number(status), count })),
  overflowRows: rows.filter((r) => r.overflow > 0).length,
  consoleErrorRows: rows.filter((r) => r.consoleErrors > 0).length,
  cspViolationRows: rows.filter((r) => r.cspViolations > 0).length,
};

writeFileSync(
  join(OUT_DIR, "verify-ui.json"),
  JSON.stringify({ summary, assertions, failures, rows }, null, 2),
);

console.log(JSON.stringify({ summary, assertions, failures }, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
