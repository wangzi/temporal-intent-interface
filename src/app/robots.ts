// robots.txt (served at /robots.txt). Snapshots (/s/) are link-only and already
// noindex; the BFF (/api) is not content. Everything else is crawlable.
//
// AI crawlers are allowed DELIBERATELY rather than by default. This site
// publishes a machine-readable resume, so being read accurately by assistants
// is the point. Each vendor is named with its official token, and every AI
// group repeats the same /s/ and /api/ exclusions as the wildcard group — an
// explicit group does NOT inherit the wildcard rules, so omitting them would
// silently open the snapshot and BFF paths to exactly these agents.
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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/s/", "/api/"],
      },
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: ["/s/", "/api/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
