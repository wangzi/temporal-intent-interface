// Pre-publication gate for the resume surfaces.
//
// WHAT THIS IS: a "not published yet" curtain, so the resume can be shared
// with specific people by sending them a link and a code.
//
// WHAT THIS IS NOT: security. The passcode is four digits and lives in this
// file, which means it is in the repository, in its history, and in every
// build artifact. Anyone with repo access has it. Treat the resume as
// semi-public and do not put anything here you would not eventually publish —
// the contact details are excluded by src/lib/resume/schemas.ts regardless,
// and that remains the actual privacy boundary.
//
// To make this a real secret later, move PASSCODE to an env var
// (RESUME_PASSCODE) and read it in middleware; nothing else has to change.

/** The shared code. Four digits, by request. */
export const RESUME_PASSCODE = "0315";

/** Cookie name and value set once the code is accepted. */
export const RESUME_COOKIE = "z_resume_access";

// Deliberately not the passcode itself, so a leaked cookie doesn't hand over
// the code someone might reuse elsewhere.
export const RESUME_COOKIE_VALUE = "8f2c-unlocked-resume-v1";

/** 30 days. Long enough that a recruiter isn't re-prompted mid-review. */
export const RESUME_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Where an un-unlocked visitor is sent. */
export const RESUME_UNLOCK_PATH = "/resume/unlock";

/**
 * Every path that exposes resume content.
 *
 * Gating only the HTML page would be pointless: /resume.json carries the same
 * record verbatim, /llms.txt is derived from it, and the OG image renders the
 * name and headline into a PNG that link-preview crawlers cache.
 */
export const GATED_PATHS = [
  "/resume",
  "/resume.json",
  "/llms.txt",
  "/resume/opengraph-image",
] as const;

export function isGatedPath(pathname: string): boolean {
  return (GATED_PATHS as readonly string[]).includes(pathname);
}

export function isUnlocked(cookieValue: string | undefined): boolean {
  return cookieValue === RESUME_COOKIE_VALUE;
}

/** Normalizes what a form submits before comparing. */
export function isCorrectPasscode(submitted: unknown): boolean {
  return typeof submitted === "string" && submitted.trim() === RESUME_PASSCODE;
}
