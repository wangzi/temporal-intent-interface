// The artifact iframe's sandbox policy.
//
// Kept out of ArtifactFrame.tsx so it can be asserted in the node test
// environment without pulling JSX through the transform — and because this
// one string is the entire containment boundary for arbitrary third-party
// code running on our origin. It deserves to be a named, tested constant
// rather than an inline attribute someone edits in passing.
//
// allow-scripts, and nothing else. In particular NEVER allow-same-origin
// alongside it: that combination lets the frame remove its own sandbox, and
// restores its ability to make credentialed same-origin requests.
export const ARTIFACT_SANDBOX = "allow-scripts";
