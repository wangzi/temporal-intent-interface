// Ask AI payload mechanics + the resume prompt contract.
//
// The ordering test below is the point of this file. "Copy, THEN open" is a
// fixed bug (window.open steals focus; a clipboard write racing it silently
// pastes the previous article), and it was previously guarded only by a
// comment. Here it's an assertion.

import { describe, expect, it } from "vitest";

import {
  AI_MODE_URL,
  buildPayload,
  sendToAiMode,
  type AiModeIo,
} from "./payload";
import { RESUME_GROUNDING, RESUME_PROMPTS } from "@/components/resume/prompts";
import { assertNoPrivateContact } from "@/lib/resume/schemas";

/** Records the order and arguments of the two side effects. */
function recorder(): {
  io: AiModeIo;
  calls: string[];
  copied: string[];
  opened: string[];
} {
  const calls: string[] = [];
  const copied: string[] = [];
  const opened: string[] = [];
  return {
    calls,
    copied,
    opened,
    io: {
      copy: (t) => {
        calls.push("copy");
        copied.push(t);
      },
      open: (u) => {
        calls.push("open");
        opened.push(u);
      },
    },
  };
}

describe("buildPayload", () => {
  it("separates prompt and source with one blank line", () => {
    expect(buildPayload("Summarize this.", "Body text.")).toBe(
      "Summarize this.\n\nBody text.",
    );
  });

  it("emits the source alone when the prompt is empty", () => {
    expect(buildPayload("", "Body text.")).toBe("Body text.");
    expect(buildPayload("   ", "Body text.")).toBe("Body text.");
  });

  it("emits the prompt alone when the source is empty", () => {
    expect(buildPayload("Summarize this.", "")).toBe("Summarize this.");
  });

  it("never opens with a blank line", () => {
    for (const [prefix, source] of [
      ["", "x"],
      ["p", ""],
      ["p", "s"],
      ["", ""],
    ] as const) {
      expect(buildPayload(prefix, source)).not.toMatch(/^\s*\n/);
    }
  });
});

describe("sendToAiMode", () => {
  it("copies BEFORE opening the tab", () => {
    const r = recorder();
    sendToAiMode("Summarize this.", "Body text.", r.io);
    expect(r.calls).toEqual(["copy", "open"]);
  });

  it("copies the full payload and opens Google AI Mode", () => {
    const r = recorder();
    const returned = sendToAiMode("Summarize this.", "Body text.", r.io);
    expect(r.copied).toEqual(["Summarize this.\n\nBody text."]);
    expect(r.opened).toEqual([AI_MODE_URL]);
    expect(returned).toBe("Summarize this.\n\nBody text.");
  });

  it("still copies first when there is no prompt prefix", () => {
    const r = recorder();
    sendToAiMode("", "Body text.", r.io);
    expect(r.calls).toEqual(["copy", "open"]);
    expect(r.copied).toEqual(["Body text."]);
  });

  it("opens AI Mode with no query pre-filled — the user pastes", () => {
    // The payload must never ride in the URL: it would land in history, in
    // referrers, and in Google's logs.
    const r = recorder();
    sendToAiMode("Summarize this.", "Body text.", r.io);
    expect(r.opened[0]).toBe("https://www.google.com/search?udm=50");
    expect(r.opened[0]).not.toContain("Body text");
  });
});

describe("resume prompt contract", () => {
  it("offers exactly three angles", () => {
    expect(RESUME_PROMPTS).toHaveLength(3);
    expect(RESUME_PROMPTS.map((p) => p.label)).toEqual([
      "Verify",
      "Fit",
      "Probe",
    ]);
  });

  it("grounds every prompt in the pasted text", () => {
    for (const p of RESUME_PROMPTS) {
      expect(p.prefix).toContain(RESUME_GROUNDING);
    }
  });

  it("tells the model to say 'not stated' rather than guess", () => {
    expect(RESUME_GROUNDING).toMatch(/not stated/i);
    expect(RESUME_GROUNDING).toMatch(/do not infer/i);
  });

  it("carries no contact details in any prompt", () => {
    expect(() => assertNoPrivateContact(RESUME_PROMPTS)).not.toThrow();
  });

  it("never asks the model to write as the person", () => {
    // Guard against the prompt set drifting toward impersonation.
    for (const p of RESUME_PROMPTS) {
      expect(p.prefix).not.toMatch(/as (this person|me|the candidate)\b/i);
      expect(p.prefix).not.toMatch(/cover letter/i);
    }
  });
});
