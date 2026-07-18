// Zod contract for the resume. This module is the trust boundary for the CV:
// the exported data is parsed through these schemas at import time, so a typo
// or a policy violation fails the build rather than shipping a false or
// over-disclosing claim about a real person.
//
// NOT `server-only` — the resume is static, public, typed data and client
// components may import it directly (role filtering, Ask-AI payloads).

import { z } from "zod";

/**
 * PRIVACY POLICY — locked.
 *
 * Public: name, city/region, LinkedIn, employer names, year-only dates, roles,
 * education, achievements and the metrics stated in the source document.
 *
 * Private: email address and phone number. These appear in the source PDF but
 * must never reach HTML, JSON, JSON-LD, OG images, llms.txt, print output,
 * prompts, tests, fixtures or snapshots.
 *
 * This is enforced structurally rather than by convention: `assertNoPrivateContact`
 * walks the whole object and rejects private-looking KEYS and VALUES, so a
 * future edit that pastes a contact line in cannot silently ship.
 */
// Substring match, not a word-boundary match. An earlier version anchored on
// ([^a-z]|$), which under /i also excludes A-Z and therefore let every
// camelCase and plural form through: emailAddress, phoneNumber, contactEmail,
// mobileNumber, emails, phones. No legitimate key in this data contains these
// stems, so matching anywhere in the key costs nothing and closes the hole.
const PRIVATE_KEY_PATTERN = /(e?mail|telephone|phone|mobile|fax)/i;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
// US phone shapes: 678-464-0214, (678) 464-0214, 678.464.0214, +1 678 464 0214.
// (?<!\d) stops a match from starting midway through a longer run of digits.
const US_PHONE_PATTERN =
  /(?<!\d)(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g;

// Typographic separators. Without this, "678–464–0214" (en dashes, which is
// what a word processor produces) defeats the ASCII-only separator class.
const UNICODE_DASHES = /[‐-―−﹘﹣－]/g;
const UNICODE_SPACES = /[  -   　]/g;

/**
 * True for a North American dialable number.
 *
 * Checked against NANP rules (area and exchange codes both start 2-9) rather
 * than raw digit count, so a ten-digit metric like 1000000000 is not mistaken
 * for a phone number while a real number still is.
 */
function isDialable(digits: string): boolean {
  const local =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(local);
}

/** Years like 2006, and metrics like "1.5M+", must not read as phone numbers. */
function looksLikePhone(value: string): boolean {
  if (value.replace(/\D/g, "").length < 10) return false;
  const normalized = value
    .replace(UNICODE_DASHES, "-")
    .replace(UNICODE_SPACES, " ");
  for (const match of normalized.matchAll(US_PHONE_PATTERN)) {
    if (isDialable(match[0].replace(/\D/g, ""))) return true;
  }
  return false;
}

export function assertNoPrivateContact(value: unknown, path = "$"): void {
  // Numbers are checked as their decimal text. A phone stored as a number
  // rather than a string used to fall through every branch below unexamined.
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value);
    if (EMAIL_PATTERN.test(text))
      throw new Error(`resume privacy: email-shaped value at ${path}`);
    if (looksLikePhone(text))
      throw new Error(`resume privacy: phone-shaped value at ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoPrivateContact(v, `${path}[${i}]`));
    return;
  }
  if (value instanceof Map) {
    for (const [k, v] of value) {
      if (typeof k === "string" && PRIVATE_KEY_PATTERN.test(k))
        throw new Error(`resume privacy: forbidden key "${k}" at ${path}`);
      assertNoPrivateContact(v, `${path}.${String(k)}`);
    }
    return;
  }
  if (value instanceof Set) {
    let i = 0;
    for (const v of value) assertNoPrivateContact(v, `${path}[${i++}]`);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      if (PRIVATE_KEY_PATTERN.test(key))
        throw new Error(`resume privacy: forbidden key "${key}" at ${path}`);
      assertNoPrivateContact(v, `${path}.${key}`);
    }
  }
}

const Id = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "ids are lowercase kebab-case");

const Year = z.number().int().min(1900).max(2100);
/** "Present" stays "Present" — never resolved to a year. */
const EndYear = z.union([Year, z.literal("Present")]);

/** One factual statement, addressable by id so role lenses can select it. */
export const ClaimSchema = z
  .object({
    id: Id,
    text: z.string().min(1),
  })
  .strict();

export const PositionSchema = z
  .object({
    id: Id,
    /** Only present when the source document states a title. Never inferred. */
    role: z.string().min(1).optional(),
    team: z.string().min(1).optional(),
    startYear: Year,
    endYear: EndYear,
    claims: z.array(ClaimSchema).min(1),
  })
  .strict()
  .refine(
    (p) => p.endYear === "Present" || p.endYear >= p.startYear,
    "endYear must not precede startYear",
  );

export const ExperienceSchema = z
  .object({
    id: Id,
    organization: z.string().min(1),
    location: z.string().min(1),
    startYear: Year,
    endYear: EndYear,
    positions: z.array(PositionSchema).min(1),
  })
  .strict();

export const EducationSchema = z
  .object({
    id: Id,
    institution: z.string().min(1),
    credential: z.string().min(1),
    /** Verbatim from the source: "2005", "2012", "2007–2009". */
    years: z.string().min(1),
  })
  .strict();

export const PersonSchema = z
  .object({
    name: z.string().min(1),
    headline: z.string().min(1),
    summary: z.array(z.string().min(1)).min(1),
    location: z.string().min(1),
    linkedin: z.string().url(),
    url: z.string().url(),
  })
  .strict();

export const ResumeSchema = z
  .object({
    /** Bumped when the public shape changes; consumed by /resume.json. */
    version: z.string().min(1),
    /** SHA-256 of the source document this transcription came from. */
    sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
    person: PersonSchema,
    experience: z.array(ExperienceSchema).min(1),
    education: z.array(EducationSchema).min(1),
    workPlay: z.array(ClaimSchema).min(1),
  })
  .strict()
  .superRefine((resume, ctx) => {
    try {
      assertNoPrivateContact(resume);
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: (err as Error).message,
      });
    }
    const ids = allClaimIds(resume);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate claim ids: ${[...new Set(dupes)].join(", ")}`,
      });
  });

/** Every addressable claim id, in document order. */
export function allClaimIds(resume: {
  experience: { positions: { claims: { id: string }[] }[] }[];
  workPlay: { id: string }[];
}): string[] {
  return [
    ...resume.experience.flatMap((e) =>
      e.positions.flatMap((p) => p.claims.map((c) => c.id)),
    ),
    ...resume.workPlay.map((c) => c.id),
  ];
}
