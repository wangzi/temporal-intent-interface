import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

// Flat config (ESLint 9). `next lint` is deprecated and removed in Next 16, so
// the `lint` script calls the ESLint CLI directly. eslint-config-next is still
// eslintrc-format, hence FlatCompat.
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "reports/**",
      // macOS/iCloud duplicates — gitignored, and must never be linted back in
      "**/* 2.*",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default config;
