// Share card for /resume, generated with next/og — same pattern, fonts and
// visual language as the per-post card (see post/[slug]/opengraph-image.tsx).
//
// Shows name, headline and the employer sequence only. No email, no phone.
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { resume } from "@/lib/resume/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${resume.person.name} — Resume`;

// Design tokens (light), mirrored from styles/tokens.css.
const FIELD = "#fcfcfa";
const INK = "#1a1a1a";
const SYSTEM = "#6b6b6b";
const BRANCH = "#c9c9c4";
const DOT = "#e5484d";

export default async function Image() {
  const [serif600, serif400] = await Promise.all([
    readFile(join(process.cwd(), "public/og/Newsreader-600.woff")),
    readFile(join(process.cwd(), "public/og/Newsreader-400.woff")),
  ]);

  const orgs = resume.experience.map((e) => e.organization).join(" · ");

  return new ImageResponse(
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
      {/* Spine + dot: the site's signature, shared with the post card. */}
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
          Resume
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 86,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: -1,
            color: INK,
          }}
        >
          {resume.person.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 30,
            fontWeight: 400,
            lineHeight: 1.3,
            color: SYSTEM,
            maxWidth: 820,
          }}
        >
          {resume.person.headline}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 22,
            color: SYSTEM,
          }}
        >
          {orgs}
        </div>
      </div>
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
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Newsreader",
          data: serif400,
          weight: 400 as const,
          style: "normal" as const,
        },
        {
          name: "Newsreader",
          data: serif600,
          weight: 600 as const,
          style: "normal" as const,
        },
      ],
    },
  );
}
