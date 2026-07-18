// The resume's Ask AI prompt set.
//
// Data, not markup — kept out of ResumeAskAi.tsx so it can be asserted against
// in the node test environment without pulling JSX through the transform. The
// prompt set is a product contract (exactly three angles, each grounded), so
// it deserves to be testable on its own terms.

import type { AiPrompt } from "@/components/ai/AskAi";

/** Canonical URL, sent as provenance so the model can attribute the source. */
export const RESUME_CANONICAL = "https://z.stillinlove.co/resume";

// Every prompt carries this. The model reads a pasted document with no
// retrieval, so the failure mode to guard against is confident invention — an
// inferred job title, a rounded metric, a filled-in gap. Naming the constraint
// explicitly is the only lever available without a backend.
export const RESUME_GROUNDING =
  "Answer only from the resume text below. Do not infer, embellish, or fill gaps. If something is not stated, say that it is not stated rather than guessing. Quote the exact line you are relying on.";

/**
 * Three fixed angles, and no free-form field.
 *
 * That's deliberate. The article's Ask AI offers an open box because an essay
 * can be read any way; a resume is a factual record, and an open box is where
 * "write me a cover letter as this person" goes. These are the three questions
 * a reader actually has — verify, fit, probe.
 */
export const RESUME_PROMPTS: readonly AiPrompt[] = [
  {
    label: "Verify",
    prefix: `Separate what this resume actually evidences from what it merely asserts. For each claim, note whether it carries a concrete outcome, scope or metric, or is a description of responsibility. ${RESUME_GROUNDING}`,
  },
  {
    label: "Fit",
    prefix: `I will describe a role after pasting this. Assess fit against it: where the evidence is strong, where it is thin, and what is simply absent from the record. Do not argue one side. ${RESUME_GROUNDING}`,
  },
  {
    label: "Probe",
    prefix: `Draft the sharpest questions to ask this person — ones that would test the claims rather than restate them, and that would surface what the resume cannot show. ${RESUME_GROUNDING}`,
  },
];
