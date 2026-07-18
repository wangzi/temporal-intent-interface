// Security headers. The CSP ships REPORT-ONLY first so a mistake can't break
// the reader; it is promoted to enforcing only after a preview deploy reports
// zero violations. Sources are the exact origins this site actually talks to —
// no wildcards, and no 'unsafe-eval' or data: for scripts outside development.
//
// Next is used here without nonces (its documented static-friendly policy), so
// 'unsafe-inline' is required for the framework's inline bootstrap script and
// for styled JSX/inline style attributes.
const isDev = process.env.NODE_ENV === "development";

const SUPABASE_ORIGIN = "https://zrbvwywfgdptvgbsgykb.supabase.co";
const STUDIO_ORIGIN = "https://studio.stillinlove.co";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  // Matches X-Frame-Options: SAMEORIGIN below.
  "frame-ancestors 'self'",
  "frame-src 'none'",
  "manifest-src 'self'",
  // data:/blob: are for IMAGES only (OG previews, inline SVG icons) — never scripts.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // 'unsafe-eval' is DEV ONLY (React Refresh); production never gets it.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Lens auth + snapshot are the only cross-origin client fetches. The resume
  // surface makes none. ws:/localhost entries are the dev HMR socket only.
  [
    "connect-src 'self'",
    STUDIO_ORIGIN,
    SUPABASE_ORIGIN,
    `wss://${SUPABASE_ORIGIN.replace("https://", "")}`,
    isDev ? "ws://127.0.0.1:* ws://localhost:*" : "",
  ]
    .filter(Boolean)
    .join(" "),
].join("; ");

const securityHeaders = [
  // Report-only during rollout — see Task 6.4 for promotion to enforcing.
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
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
