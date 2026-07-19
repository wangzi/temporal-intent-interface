// Embeds a self-contained interactive artifact — the kind Claude or ChatGPT
// produces — inside a case.
//
// SECURITY, and the reason this is its own file with this much comment:
//
// The artifact is arbitrary HTML and JavaScript. It is served from OUR origin,
// which means that without a sandbox it would run with our privileges: it
// could fetch /resume.json with the visitor's gate cookie attached and post
// the contents anywhere. `httpOnly` protects the cookie from being READ by
// script, not from being SENT.
//
// So: sandbox="allow-scripts" and nothing else.
//
// Omitting `allow-same-origin` is the load-bearing part. It gives the frame a
// unique opaque origin, so it cannot read our DOM, our storage, or make
// same-origin credentialed requests — while still running its own JavaScript,
// which is the whole point of an interactive artifact.
//
// NEVER add allow-same-origin alongside allow-scripts. That combination is
// self-defeating: a frame with both can reach into its own frame element and
// remove the sandbox attribute entirely. If an artifact seems to "need" it,
// the artifact is doing something it should not be doing in a portfolio.
//
// The frame is same-origin-hosted rather than pointed at claude.site so the
// CSP stays at `frame-src 'self'`. That also means the artifact is versioned
// in the repo and cannot change or disappear underneath the case.

import type { Artifact } from "@/lib/work/types";

// The sandbox policy lives in ./sandbox.ts so it can be tested directly.
import { ARTIFACT_SANDBOX } from "./sandbox";

export function ArtifactFrame({ artifact }: { artifact: Artifact }) {
  return (
    <figure className="work-artifact">
      <iframe
        className="work-artifact-frame"
        src={artifact.src}
        title={artifact.title}
        height={artifact.height}
        sandbox={ARTIFACT_SANDBOX}
        loading="lazy"
        // No allow= list: artifacts get no camera, microphone, geolocation or
        // payment access. Add one deliberately if a case ever needs it.
      />
      <figcaption className="work-artifact-caption mono">
        <span className="work-artifact-title">{artifact.title}</span>
        {/* Also the fallback for anyone who can't run the frame. */}
        <span className="work-artifact-desc">{artifact.description}</span>
        <a
          className="work-artifact-open"
          href={artifact.src}
          target="_blank"
          rel="noopener noreferrer"
        >
          open standalone ↗
        </a>
      </figcaption>
    </figure>
  );
}
