/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
