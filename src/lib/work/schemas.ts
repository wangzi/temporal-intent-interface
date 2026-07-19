// Zod contract for the work surface (/work).
//
// The resume is a factual record locked to a source PDF. The portfolio is
// something different: authored narrative about the same work. Those two kinds
// of text must not blur together, so this schema keeps them structurally
// separate and enforces the boundary rather than trusting a convention.
//
// The rule: a case may NARRATE freely, but it may not ASSERT a number.
// Quantitative claims are referenced by resume claim id and rendered from the
// resume's own text, so "$1M+ raised" can never drift into "$2M raised" in a
// retelling. See assertNoLooseMetrics below — that rule is mechanical.

import { z } from "zod";

import { assertNoPrivateContact } from "@/lib/resume/schemas";

const Slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "slugs are lowercase kebab-case");

/**
 * Narrative paragraphs are authored by the site owner. They are NOT generated
 * and NOT derived from the source PDF — which is exactly why they carry a
 * status, so unwritten cases cannot be mistaken for finished ones.
 */
const Narrative = z.string().min(1);

/** Where a case is in its life. Drafts render with a visible marker. */
export const CaseStatusSchema = z.enum(["draft", "published"]);

/**
 * Self-hosted media. Remote URLs are deliberately not allowed: the CSP serves
 * images from 'self' only, and a portfolio that depends on someone else's CDN
 * breaks quietly when that CDN changes.
 */
export const MediaSchema = z
  .object({
    src: z
      .string()
      .regex(
        /^\/work\/media\//,
        "media must be self-hosted under /work/media/",
      ),
    /** Required. A portfolio image with no alt text is a portfolio image nobody can read. */
    alt: z.string().min(1),
    caption: z.string().optional(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();

/**
 * An interactive artifact — a self-contained HTML page (the kind Claude or
 * ChatGPT produces) embedded in a case.
 *
 * Self-hosted under /work/artifacts/ for two reasons. It keeps `frame-src`
 * at 'self' instead of trusting a third-party origin, and it means the
 * artifact is versioned with the repo rather than living at a URL that can
 * change or disappear.
 */
export const ArtifactSchema = z
  .object({
    src: z
      .string()
      .regex(
        /^\/work\/artifacts\/[a-z0-9-]+\/index\.html$/,
        "artifacts must be self-hosted at /work/artifacts/<id>/index.html",
      ),
    title: z.string().min(1),
    /** Shown to anyone who can't run the frame. */
    description: z.string().min(1),
    height: z.number().int().positive().max(1200),
  })
  .strict();

export const WorkCaseSchema = z
  .object({
    slug: Slug,
    title: z.string().min(1),
    status: CaseStatusSchema,
    // No `period` field on purpose. For employer-linked cases the dates are
    // derived from the resume entry, so a case can never disagree with the
    // record about when something happened. Work that has no stated period in
    // the source document simply shows none, rather than acquiring one here.
    /**
     * Optional link to the resume's experience entry, so a case and the record
     * agree on employer, dates and location without restating them.
     */
    organizationId: Slug.optional(),
    /**
     * Resume claim ids this case is evidence for. Rendered from the resume's
     * text, never retyped here. Validated to exist in work/data.ts.
     */
    evidenceClaimIds: z.array(Slug).default([]),
    /** Authored prose. Empty while a case is still a draft. */
    narrative: z.array(Narrative).default([]),
    media: z.array(MediaSchema).default([]),
    artifacts: z.array(ArtifactSchema).default([]),
    links: z
      .array(
        z
          .object({
            label: z.string().min(1),
            href: z.string().url(),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();

// Numbers, money, multipliers and scale suffixes. Deliberately broad: the
// point is to catch a metric arriving in authored prose at all, not to
// classify it.
const METRIC_PATTERN =
  /(\$\s?\d|\d+\s?(%|x\b|K\b|M\b|B\b|k\+|m\+)|\b\d{3,}\b|\b\d+(\.\d+)?\s?(million|billion|thousand)\b)/i;

/**
 * Narrative may not contain a bare metric.
 *
 * Every number about this work already exists, verbatim and verified against
 * the source PDF, as a resume claim. Retyping one into a case is how "1.5M+
 * users" quietly becomes "over 2M users" a year later, with nothing to catch
 * it — the resume's own verifier only looks at the resume. Reference the claim
 * id instead and the number renders from the record.
 */
export function assertNoLooseMetrics(
  narrative: readonly string[],
  where: string,
): void {
  for (const [i, paragraph] of narrative.entries()) {
    const found = paragraph.match(METRIC_PATTERN);
    if (found) {
      throw new Error(
        `work: narrative metric "${found[0]}" in ${where}[${i}] — ` +
          "reference a resume claim id in evidenceClaimIds instead of " +
          "restating a number in prose",
      );
    }
  }
}

export const WorkSchema = z
  .object({
    version: z.literal("1.0.0"),
    cases: z.array(WorkCaseSchema).min(1),
  })
  .strict()
  .superRefine((work, ctx) => {
    const addIssue = (message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });

    try {
      assertNoPrivateContact(work);
    } catch (err) {
      addIssue((err as Error).message);
    }

    const slugs = work.cases.map((c) => c.slug);
    const duplicate = slugs.find((s, i) => slugs.indexOf(s) !== i);
    if (duplicate) addIssue(`work: duplicate case slug "${duplicate}"`);

    for (const workCase of work.cases) {
      try {
        assertNoLooseMetrics(workCase.narrative, workCase.slug);
      } catch (err) {
        addIssue((err as Error).message);
      }

      // A published case with nothing written is a broken promise.
      if (workCase.status === "published" && workCase.narrative.length === 0) {
        addIssue(
          `work: case "${workCase.slug}" is published but has no narrative`,
        );
      }

      const artifactIds = workCase.artifacts.map((a) => a.src);
      if (new Set(artifactIds).size !== artifactIds.length) {
        addIssue(
          `work: case "${workCase.slug}" embeds the same artifact twice`,
        );
      }
    }
  });
