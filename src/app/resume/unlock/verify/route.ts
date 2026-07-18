// Accepts the unlock form, sets the cookie, and sends the visitor on.
//
// A route handler rather than a Server Action so the flow is an ordinary HTML
// form POST with no JavaScript involved, and so the redirect targets can be
// validated explicitly.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  RESUME_COOKIE,
  RESUME_COOKIE_MAX_AGE,
  RESUME_COOKIE_VALUE,
  RESUME_UNLOCK_PATH,
  isCorrectPasscode,
} from "@/lib/resume/gate";

/**
 * Only same-site resume paths are accepted as a redirect target. Without this,
 * `?next=https://evil.example` would turn the unlock form into an open
 * redirect that borrows this domain's credibility.
 */
function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/resume";
  if (!value.startsWith("/resume")) return "/resume";
  // Protocol-relative URLs (`//host`) are absolute despite the leading slash.
  if (value.startsWith("//")) return "/resume";
  return value;
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const next = safeNext(form.get("next"));

  // A RELATIVE Location, deliberately.
  //
  // Both request.url and request.nextUrl report the server's own origin
  // ("localhost") rather than the host the browser used, so building an
  // absolute URL from either sends a visitor on 127.0.0.1 — or on any domain
  // reached through a proxy — to a cross-origin address. `form-action 'self'`
  // then blocks the submission: the POST completes and the cookie is set, but
  // the browser refuses the redirect and drops the visitor back on the form
  // with no explanation. The CSP is right; the absolute URL was wrong.
  //
  // A relative Location is resolved by the browser against the request it
  // actually made, so it is same-origin by construction, on every host.
  const seeOther = (path: string) =>
    new NextResponse(null, { status: 303, headers: { Location: path } });

  if (!isCorrectPasscode(form.get("passcode"))) {
    return seeOther(
      `${RESUME_UNLOCK_PATH}?error=1&next=${encodeURIComponent(next)}`,
    );
  }

  const response = seeOther(next);
  response.cookies.set(RESUME_COOKIE, RESUME_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RESUME_COOKIE_MAX_AGE,
  });
  return response;
}
