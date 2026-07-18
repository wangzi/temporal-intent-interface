// The curtain. A plain <form> posting to a route handler — no client
// component, no JavaScript required, consistent with the rest of the resume.

import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/reader/Footer";

export const metadata: Metadata = {
  title: "Resume — z.",
  // Never index the curtain, and don't let it inherit a canonical.
  robots: { index: false, follow: false },
  alternates: { canonical: "/resume/unlock" },
};

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/resume";
  const failed = params.error === "1";

  return (
    <>
      <main className="resume resume-unlock" id="resume-unlock">
        <h1 className="resume-unlock-title">Not published yet</h1>
        <p className="resume-unlock-note" data-text-origin="generated">
          This resume isn&rsquo;t public. If you were given a code, enter it.
        </p>

        <form
          className="resume-unlock-form"
          method="post"
          action="/resume/unlock/verify"
        >
          <input type="hidden" name="next" value={next} />
          <label className="resume-unlock-label mono" htmlFor="passcode">
            Code
          </label>
          <input
            className="resume-unlock-input mono"
            id="passcode"
            name="passcode"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            required
            aria-describedby={failed ? "unlock-error" : undefined}
          />
          <button className="resume-unlock-submit mono" type="submit">
            Enter →
          </button>
        </form>

        {failed ? (
          <p
            className="resume-unlock-error mono"
            id="unlock-error"
            role="alert"
          >
            That code doesn&rsquo;t match.
          </p>
        ) : null}

        <p className="resume-unlock-back mono">
          <Link className="resume-link" href="/">
            ← back to z.
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
