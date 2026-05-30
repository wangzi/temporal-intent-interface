import { z } from "zod";

// Zod-validated env. App boot fails loud (throws at import time) if
// any required var is missing or malformed. Mirrors journalkit's
// fail-loud-on-import pattern.
//
// Build-phase carve-out (NEXT_PHASE === "phase-production-build"):
// `next build` may run without real secrets in CI, so placeholders
// are accepted. Real values must be present at runtime.

const EnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  JOURNALKIT_API_URL: z.string().url(),
  JOURNALKIT_API_KEY: z.string().optional(),
  /** "true" enables fixture mode; anything else (including unset) disables it. */
  JOURNALKIT_FIXTURE_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof EnvSchema>;

const BUILD_PLACEHOLDERS: Partial<Record<keyof Env, string>> = {
  NEXT_PUBLIC_SITE_URL: "https://z.stillinlove.co",
  JOURNALKIT_API_URL: "https://studio.stillinlove.co/api/v1",
};

function loadEnv(): Env {
  const raw: Record<string, string | undefined> = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    JOURNALKIT_API_URL: process.env.JOURNALKIT_API_URL,
    JOURNALKIT_API_KEY: process.env.JOURNALKIT_API_KEY,
    JOURNALKIT_FIXTURE_MODE: process.env.JOURNALKIT_FIXTURE_MODE,
  };

  if (process.env.NEXT_PHASE === "phase-production-build") {
    for (const [key, fallback] of Object.entries(BUILD_PLACEHOLDERS)) {
      if (!raw[key]) raw[key] = fallback;
    }
  }

  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const summary = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`env: invalid configuration\n${summary}`);
  }

  // Runtime contract: outside fixture mode and outside build phase,
  // JOURNALKIT_API_KEY is required.
  if (
    !parsed.data.JOURNALKIT_FIXTURE_MODE &&
    process.env.NEXT_PHASE !== "phase-production-build" &&
    !parsed.data.JOURNALKIT_API_KEY
  ) {
    throw new Error(
      "env: JOURNALKIT_API_KEY is required when JOURNALKIT_FIXTURE_MODE is not true",
    );
  }

  return parsed.data;
}

export const env: Readonly<Env> = Object.freeze(loadEnv());
