"use client";

// The interrogable layer. Same mechanics as the article's Ask AI dot
// (components/ai), configured for a resume: copy the resume, open Google AI
// Mode, let the reader interrogate it in their own session.
//
// The prompt set lives in ./prompts.ts — it's a product contract with its own
// tests, not an implementation detail of this component.
//
// No backend, no key, no dependency: the resume text is already on the page,
// and the model runs on the user's side of the window.

import { AskAi } from "@/components/ai/AskAi";
import { resume } from "@/lib/resume/data";

import { RESUME_CANONICAL, RESUME_PROMPTS } from "./prompts";

export function ResumeAskAi() {
  // Read the rendered resume, not a second copy of the facts. The control
  // mounts outside #resume-main, so its own labels can never end up in the
  // text being sent.
  function resumeText(): string {
    const main = document.getElementById("resume-main");
    const body = main ? main.innerText.trim() : "";
    const header = `${resume.person.name} — Resume\nSource: ${RESUME_CANONICAL}`;
    return body ? `${header}\n\n${body}` : header;
  }

  return (
    <AskAi
      className="resume-ask-ai"
      prompts={RESUME_PROMPTS}
      getSource={resumeText}
      labels={{
        dot: "Ask AI →",
        dotAria: "Ask Google AI about this resume",
        head: "Interrogate this resume",
        note: "Copies the resume, then opens Google AI Mode to paste.",
        toast: "Resume copied — paste it into Google AI Mode.",
      }}
    />
  );
}
