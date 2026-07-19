// Types inferred from the schemas, so the runtime contract and the compile-time
// contract cannot drift apart.

import type { z } from "zod";

import type {
  ArtifactSchema,
  CaseStatusSchema,
  MediaSchema,
  WorkCaseSchema,
  WorkSchema,
} from "./schemas";

export type CaseStatus = z.infer<typeof CaseStatusSchema>;
export type Media = z.infer<typeof MediaSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export type WorkCase = z.infer<typeof WorkCaseSchema>;
export type Work = z.infer<typeof WorkSchema>;
