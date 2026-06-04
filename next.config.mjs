/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
