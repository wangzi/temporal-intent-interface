// Pre-publication gate. Runs before the resume surfaces are rendered, so
// gated content never leaves the server unauthenticated — unlike a client-side
// check, which would ship the whole record to the browser and then hide it.
//
// The reader (archive, posts, snapshots, feed) is untouched: the matcher below
// lists resume paths only.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  RESUME_COOKIE,
  RESUME_UNLOCK_PATH,
  isUnlocked,
} from "@/lib/resume/gate";

export function middleware(request: NextRequest) {
  if (isUnlocked(request.cookies.get(RESUME_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  // The page sends people somewhere they can do something about it.
  if (pathname === "/resume") {
    const url = request.nextUrl.clone();
    url.pathname = RESUME_UNLOCK_PATH;
    url.search = search ? `?next=${encodeURIComponent(pathname + search)}` : "";
    return NextResponse.redirect(url);
  }

  // The machine-readable surfaces just aren't there yet. 404 rather than 401:
  // while unpublished, these endpoints have nothing to say to a crawler, and
  // announcing "this exists but is protected" invites exactly the attention
  // the gate is meant to avoid.
  return new NextResponse("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export const config = {
  // Exact paths only. /resume/unlock and its verify handler must stay open,
  // and nothing under the reader may be matched.
  matcher: ["/resume", "/resume.json", "/llms.txt", "/resume/opengraph-image"],
};
