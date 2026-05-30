// Tailwind v4 uses CSS-based configuration via `@theme inline` in
// `src/app/globals.css`. This file is intentionally minimal — kept only
// so editor plugins that look for it don't complain. If you downgrade
// to Tailwind v3, fill this in with a v3-style config.
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
};

export default config;
