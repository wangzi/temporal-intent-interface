// Types for next.config.mjs, so the security-header tests can import it
// without an `any` escape hatch. The config itself stays plain JS because
// Next loads it directly.
import type { NextConfig } from "next";

export declare function buildContentSecurityPolicy(options?: {
  isDev?: boolean;
  isPreview?: boolean;
}): string;

declare const nextConfig: NextConfig;
export default nextConfig;
