// Security headers. The CSP shipped REPORT-ONLY first so a mistake couldn't
// break the reader, and is now ENFORCING. Sources are the exact origins this
// site actually talks to — no wildcards, and no 'unsafe-eval' or data: for
// scripts outside development.
//
// Promotion evidence — preview z-stillinlove-62gf1vrne at commit 7b59f78:
// 36 rows (4 routes x 9 viewport/scheme configs), 0 violations, with the
// harness listening for securitypolicyviolation. That listener is what makes
// the zero worth anything: the previous filter kept only console type "error",
// while Chrome reports CSP violations at type "info", so it had literally never
// been able to see one. Its first real run caught Vercel's preview toolbar.
//
// Next is used here without nonces (its documented static-friendly policy), so
// 'unsafe-inline' is required for the framework's inline bootstrap script and
// for styled JSX/inline style attributes.
//
// Built as a pure function of its two environment flags so the production
// policy can be asserted directly (see src/lib/security/csp.test.ts). An
// untested "production is unaffected" claim about a security header is worth
// about as much as an unfalsifiable rollout gate.
// Vercel injects its preview toolbar (vercel.live) into preview deployments
// only. Production never receives it, so the allowance below is gated the same
// way the dev-only HMR entries are — production's policy is unchanged by it.
//
// This is not hypothetical: the first preview run of the harness reported the
// toolbar script as a script-src-elem violation on all 36 rows. Allowing it
// here is what makes a subsequent clean run mean "our own resources violate
// nothing", which is the only signal worth promoting the policy on.

const SUPABASE_ORIGIN = "https://zrbvwywfgdptvgbsgykb.supabase.co";
const STUDIO_ORIGIN = "https://studio.stillinlove.co";
const VERCEL_LIVE_ORIGIN = "https://vercel.live";
const VERCEL_ASSETS_ORIGIN = "https://assets.vercel.com";
const VERCEL_LIVE_SOCKET = "wss://ws-us3.pusher.com";

export function buildContentSecurityPolicy({
  isDev = false,
  isPreview = false,
} = {}) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    // Matches X-Frame-Options: SAMEORIGIN below.
    "frame-ancestors 'self'",
    ["frame-src", isPreview ? VERCEL_LIVE_ORIGIN : "'none'"].join(" "),
    "manifest-src 'self'",
    // data:/blob: are for IMAGES only (OG previews, inline SVG icons) — never scripts.
    ["img-src 'self' data: blob:", isPreview ? VERCEL_ASSETS_ORIGIN : ""]
      .filter(Boolean)
      .join(" "),
    ["font-src 'self' data:", isPreview ? VERCEL_ASSETS_ORIGIN : ""]
      .filter(Boolean)
      .join(" "),
    ["style-src 'self' 'unsafe-inline'", isPreview ? VERCEL_LIVE_ORIGIN : ""]
      .filter(Boolean)
      .join(" "),
    // 'unsafe-eval' is DEV ONLY (React Refresh); production never gets it.
    // vercel.live is PREVIEW ONLY; production never gets that either.
    [
      "script-src 'self' 'unsafe-inline'",
      isDev ? "'unsafe-eval'" : "",
      isPreview ? VERCEL_LIVE_ORIGIN : "",
    ]
      .filter(Boolean)
      .join(" "),
    // Lens auth + snapshot are the only cross-origin client fetches. The resume
    // surface makes none. ws:/localhost entries are the dev HMR socket only,
    // and the pusher socket is the preview toolbar's.
    [
      "connect-src 'self'",
      STUDIO_ORIGIN,
      SUPABASE_ORIGIN,
      `wss://${SUPABASE_ORIGIN.replace("https://", "")}`,
      isDev ? "ws://127.0.0.1:* ws://localhost:*" : "",
      isPreview ? `${VERCEL_LIVE_ORIGIN} ${VERCEL_LIVE_SOCKET}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  ].join("; ");
}

const isDev = process.env.NODE_ENV === "development";
const isPreview = process.env.VERCEL_ENV === "preview";
const contentSecurityPolicy = buildContentSecurityPolicy({ isDev, isPreview });

const securityHeaders = [
  // Enforcing. A violation now blocks the resource rather than logging it, so
  // widen this only with a preview run that shows the new origin is needed.
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // No includeSubDomains / preload: this domain is not the apex owner of every
  // subdomain and preload is irreversible in practice.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Pin the workspace root to THIS directory. Next otherwise walks up looking
  // for lockfiles and can select an ancestor — a stray ~/package-lock.json made
  // it pick $HOME, which leaked a home-directory file into 13 of 18 route
  // traces and stopped local builds from reproducing Vercel's.
  outputFileTracingRoot: import.meta.dirname,
  // Bundle the per-post OG image's Newsreader fonts (read from public/og via
  // fs at render time) into that route's serverless function.
  outputFileTracingIncludes: {
    "/post/[slug]/opengraph-image": ["./public/og/**"],
  },
  experimental: {
    // optimizePackageImports kept lean; add packages here only when
    // a real bundle-size issue surfaces (next/font handles font CSS itself).
    optimizePackageImports: [],
  },
  // No remotePatterns yet — TII renders only sanitized HTML from the engine.
  // Add a remotePatterns entry for *.supabase.co only when post-body images
  // are confirmed to land in Phase B.
};

export default nextConfig;
