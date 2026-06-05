import type { Metadata, Viewport } from "next";
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
  // Default canonical → home; the filtered archive modes (?focus/?q/?sort)
  // consolidate here. The post route overrides this with its own canonical.
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "z.",
    type: "website",
  },
};

// viewport-fit=cover lets the page extend under the notch so fixed controls
// can be padded clear of it with env(safe-area-inset-*) (see globals.css).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      <body>
        {/* No-flash theme init: apply a manually-chosen Light/Dark before paint.
            Absent/`system` → no attribute → globals.css @media handles it.
            Runs synchronously; JS-off readers simply get the system theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}})()",
          }}
        />
        {children}
      </body>
    </html>
  );
}
