// Per-post OpenGraph/Twitter card, generated with next/og (built-in; no dep).
// Matches the reader's identity: time-spine + attention dot, mono kicker,
// Newsreader serif title on the field-cream ground. Next auto-injects the
// og:image + twitter:image meta for the post route from this file.
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getPost } from "@/lib/engine/client";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "z. — a post";

// Design tokens (light), mirrored from globals.css :root.
const FIELD = "#fcfcfa";
const INK = "#1a1a1a";
const SYSTEM = "#6b6b6b";
const BRANCH = "#c9c9c4";
const DOT = "#e5484d";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [serif600, serif400] = await Promise.all([
    readFile(join(process.cwd(), "public/og/Newsreader-600.woff")),
    readFile(join(process.cwd(), "public/og/Newsreader-400.woff")),
  ]);

  let kicker = "";
  let title = "z.";
  try {
    const { post } = await getPost(slug);
    title = post.title;
    kicker = post.intent_label ?? "";
  } catch {
    // Unknown slug → generic branded card (never 500 the OG endpoint).
  }

  const fonts = [
    { name: "Newsreader", data: serif400, weight: 400 as const, style: "normal" as const },
    { name: "Newsreader", data: serif600, weight: 600 as const, style: "normal" as const },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: FIELD,
          fontFamily: "Newsreader",
          position: "relative",
        }}
      >
        {/* time spine + attention dot */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 0,
            bottom: 0,
            width: 2,
            background: BRANCH,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 89,
            top: 252,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: DOT,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px 96px 80px 168px",
            height: "100%",
          }}
        >
          {kicker ? (
            <div
              style={{
                fontSize: 26,
                fontWeight: 400,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: SYSTEM,
                marginBottom: 28,
              }}
            >
              {kicker}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: -1,
              color: INK,
              // clamp very long titles
              maxHeight: 320,
              overflow: "hidden",
            }}
          >
            {title}
          </div>
        </div>
        {/* brand */}
        <div
          style={{
            position: "absolute",
            right: 64,
            bottom: 48,
            display: "flex",
            fontSize: 40,
            fontWeight: 600,
            color: INK,
          }}
        >
          z<span style={{ color: DOT }}>.</span>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
