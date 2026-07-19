// The artifact sandbox.
//
// This is the highest-consequence line in the work surface, and it is one
// attribute long, so it gets its own test.
//
// Artifacts are arbitrary HTML and JS served from OUR origin. The CSP does not
// contain them — `frame-src 'self'` permits them precisely because they are
// self-hosted. Containment is entirely the sandbox's job.

import { describe, expect, it } from "vitest";

import { ARTIFACT_SANDBOX } from "./sandbox";

const flags = ARTIFACT_SANDBOX.split(/\s+/).filter(Boolean);

describe("artifact iframe sandbox", () => {
  it("grants scripts, because an inert artifact is pointless", () => {
    expect(flags).toContain("allow-scripts");
  });

  it("NEVER grants allow-same-origin", () => {
    // With both allow-scripts and allow-same-origin, a frame can reach its own
    // frame element and delete the sandbox attribute — the sandbox becomes
    // decorative. It would also regain our origin, and therefore the ability
    // to fetch /resume.json with the visitor's gate cookie attached. httpOnly
    // stops script from READING that cookie, not from SENDING it.
    expect(flags).not.toContain("allow-same-origin");
  });

  it("grants nothing beyond scripts", () => {
    // Anything added here should be a deliberate, argued decision rather than
    // something copied from a tutorial.
    expect(flags).toEqual(["allow-scripts"]);
  });

  it.each([
    "allow-same-origin",
    "allow-top-navigation",
    "allow-top-navigation-by-user-activation",
    "allow-popups",
    "allow-modals",
    "allow-downloads",
    "allow-forms",
    "allow-pointer-lock",
    "allow-presentation",
    "allow-storage-access-by-user-activation",
  ])("does not grant %s", (flag) => {
    expect(flags).not.toContain(flag);
  });

  it("is a non-empty sandbox, not an accidental opt-out", () => {
    // sandbox="" is maximally restrictive, but an *absent* attribute is no
    // sandbox at all. Guard against the constant being emptied to "".
    expect(ARTIFACT_SANDBOX.trim().length).toBeGreaterThan(0);
  });
});
