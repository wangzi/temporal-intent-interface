// Types are derived from the Zod schemas so the runtime contract and the
// compile-time contract cannot drift.

import type { z } from "zod";

import type {
  ClaimSchema,
  EducationSchema,
  ExperienceSchema,
  PersonSchema,
  PositionSchema,
  ResumeSchema,
} from "./schemas";

export type Claim = z.infer<typeof ClaimSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type Resume = z.infer<typeof ResumeSchema>;

/** Claim id -> claim, for role lenses that select by id. */
export type ClaimIndex = ReadonlyMap<string, Claim>;
