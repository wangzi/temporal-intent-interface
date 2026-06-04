import type { Metadata } from "next";
import { Newsreader } from "next/font/google";

import "./globals.css";

// Newsreader — canonical serif for author / canonical body text.
// Optical sizing 6..72 covers the prototype's title-scan + title-read.
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif-google",
  display: "swap",
  adjustFontFallback: true,
});

// Mono is the system SF Mono (Apple) with a self-hosted iA Writer Duo S
// fallback for non-Apple platforms — declared via @font-face + the --font-mono
// token in globals.css, so no next/font loader is needed here.

export const metadata: Metadata = {
  title: {
    default: "z.",
    template: "%s — z.",
  },
  description:
    "A personal journal. Reading as an active, AI-native operation. Time, intent, attention, relation.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://z.stillinlove.co",
  ),
  openGraph: {
    siteName: "z.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={newsreader.variable}
    >
      <body>{children}</body>
    </html>
  );
}
