// The security headers are a locked contract, and the parts most likely to
// rot are the conditional ones: a dev-only or preview-only allowance that
// quietly reaches production is invisible until it is exploited.
//
// So these tests assert the PRODUCTION policy directly, rather than trusting
// that a `process.env` check was written correctly.

import { describe, expect, it } from "vitest";

import nextConfig, {
  buildContentSecurityPolicy,
} from "../../../next.config.mjs";

const production = buildContentSecurityPolicy({
  isDev: false,
  isPreview: false,
});
const development = buildContentSecurityPolicy({
  isDev: true,
  isPreview: false,
});
const preview = buildContentSecurityPolicy({ isDev: false, isPreview: true });

const directive = (policy: string, name: string): string =>
  policy.split("; ").find((d) => d === name || d.startsWith(`${name} `)) ?? "";

describe("production content security policy", () => {
  it.each([
    ["default-src", "default-src 'self'"],
    ["base-uri", "base-uri 'self'"],
    ["object-src", "object-src 'none'"],
    ["form-action", "form-action 'self'"],
    ["frame-ancestors", "frame-ancestors 'self'"],
    ["frame-src", "frame-src 'self'"],
    ["manifest-src", "manifest-src 'self'"],
    ["media-src", "media-src 'self'"],
  ])("locks %s", (name, expected) => {
    expect(directive(production, name)).toBe(expected);
  });

  it("never allows a wildcard source", () => {
    expect(production).not.toMatch(/(^|[\s;])\*/);
    expect(production).not.toContain("http:");
  });

  it("never allows unsafe-eval", () => {
    expect(production).not.toContain("unsafe-eval");
  });

  it("allows data: and blob: for images and fonts but never for scripts", () => {
    expect(directive(production, "img-src")).toContain("data:");
    expect(directive(production, "img-src")).toContain("blob:");
    expect(directive(production, "font-src")).toContain("data:");
    expect(directive(production, "script-src")).not.toContain("data:");
    expect(directive(production, "script-src")).not.toContain("blob:");
  });

  it("talks to exactly the two cross-origin services it uses", () => {
    expect(directive(production, "connect-src")).toBe(
      "connect-src 'self' https://studio.stillinlove.co " +
        "https://zrbvwywfgdptvgbsgykb.supabase.co " +
        "wss://zrbvwywfgdptvgbsgykb.supabase.co",
    );
  });
});

describe("conditional allowances stay out of production", () => {
  it("keeps unsafe-eval in development only", () => {
    expect(directive(development, "script-src")).toContain("'unsafe-eval'");
    expect(directive(production, "script-src")).not.toContain("'unsafe-eval'");
    expect(directive(preview, "script-src")).not.toContain("'unsafe-eval'");
  });

  it("keeps the dev HMR websocket in development only", () => {
    expect(directive(development, "connect-src")).toContain("ws://127.0.0.1:*");
    expect(directive(production, "connect-src")).not.toContain("ws://");
    expect(directive(preview, "connect-src")).not.toContain("ws://127.0.0.1");
  });

  it("keeps the Vercel preview toolbar in preview only", () => {
    // Vercel injects vercel.live into preview deployments; production never
    // receives it. Allowing it unconditionally would widen script-src on the
    // live site to a third-party origin for a tool nobody there can see.
    expect(directive(preview, "script-src")).toContain("https://vercel.live");
    expect(directive(preview, "frame-src")).toContain("https://vercel.live");
    expect(directive(preview, "connect-src")).toContain(
      "wss://ws-us3.pusher.com",
    );

    for (const d of [
      "script-src",
      "frame-src",
      "connect-src",
      "style-src",
      "img-src",
      "font-src",
    ]) {
      expect(directive(production, d), d).not.toContain("vercel");
    }
    expect(production).not.toContain("pusher");
  });

  it("allows framing only our own origin, never a third party", () => {
    // /work embeds interactive artifacts. They are self-hosted so this can
    // stay at 'self'; containment comes from the frame sandbox, not from CSP
    // (see src/components/work/ArtifactFrame.tsx). A third-party frame origin
    // here would mean embedding code we cannot version or review.
    expect(directive(production, "frame-src")).toBe("frame-src 'self'");
    expect(directive(production, "frame-src")).not.toContain("http");
  });
});

describe("transport and framing headers", () => {
  it("sends HSTS without includeSubDomains or preload", async () => {
    const [rule] = (await nextConfig.headers?.()) ?? [];
    const hsts = rule?.headers.find(
      (h) => h.key === "Strict-Transport-Security",
    );
    expect(hsts?.value).toBe("max-age=63072000");
    expect(hsts?.value).not.toContain("includeSubDomains");
    expect(hsts?.value).not.toContain("preload");
  });

  it("applies every security header to all paths", async () => {
    const [rule] = (await nextConfig.headers?.()) ?? [];
    expect(rule?.source).toBe("/:path*");
    const keys = (rule?.headers ?? []).map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "X-Frame-Options",
      ]),
    );
    expect(keys.some((k) => k.startsWith("Content-Security-Policy"))).toBe(
      true,
    );
  });
});
