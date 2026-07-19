// robots.txt (served at /robots.txt). Snapshots (/s/) are link-only and already
// noindex; the BFF (/api) is not content. Everything else is crawlable.
//
// AI crawlers are named DELIBERATELY rather than left to the default: the
// intent is for a machine-readable resume to be read accurately by assistants.
// But the resume is NOT PUBLISHED YET (src/lib/resume/gate.ts), so /resume and
// its machine-readable surfaces are disallowed for the moment. Remove those
// entries in the same change that removes the gate.
//
// Each vendor is named with its official token, and every AI group repeats the
// same exclusions as the wildcard group — an explicit group does NOT inherit
// the wildcard rules, so omitting them would silently open those paths to
// exactly these agents.
//
// Tokens (vendor documentation):
//   OpenAI       OAI-SearchBot (search), GPTBot (training)
//   Anthropic    Claude-SearchBot, Claude-User (user-initiated), ClaudeBot
//   Perplexity   PerplexityBot (index), Perplexity-User (user-initiated)
//   Google       Google-Extended (Gemini/Vertex training opt-in)
import type { MetadataRoute } from "next";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://z.stillinlove.co"
).replace(/\/+$/, "");

const AI_CRAWLERS = [
  "OAI-SearchBot",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
];

// Snapshots and the BFF are permanently excluded. The resume entries are
// temporary and come out with the gate.
const DISALLOW = [
  "/s/",
  "/api/",
  "/resume",
  "/resume.json",
  "/llms.txt",
  "/work",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
