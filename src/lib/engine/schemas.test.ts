// Contract test: every committed fixture must satisfy the Zod schema that
// guards the real engine response. The fixtures are the offline stand-in for
// journalkit, so if they drift from the schema, fixture mode silently diverges
// from production — and that divergence is invisible until something 500s.
//
// These files are free test vectors: they already exist in the repo and are
// the exact shapes the engine returns.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FocusResponseSchema,
  FocusRouteResponseSchema,
  PostDetailResponseSchema,
  PostsListResponseSchema,
} from "./schemas";

const FIXTURES = join(process.cwd(), "src/lib/engine/fixtures");
const read = (f: string) => JSON.parse(readFileSync(join(FIXTURES, f), "utf8"));
const names = readdirSync(FIXTURES).filter((f) => f.endsWith(".json"));

describe("engine fixtures satisfy their schemas", () => {
  it("has fixtures to check (guards against a silently empty suite)", () => {
    expect(names.length).toBeGreaterThan(0);
  });

  it("posts.json parses as a posts list", () => {
    expect(() =>
      PostsListResponseSchema.parse(read("posts.json")),
    ).not.toThrow();
  });

  it("focus.json parses as a focus index", () => {
    expect(() => FocusResponseSchema.parse(read("focus.json"))).not.toThrow();
  });

  const postDetails = names.filter((f) => f.startsWith("post-"));
  it.each(postDetails)("%s parses as a post detail", (file) => {
    expect(() => PostDetailResponseSchema.parse(read(file))).not.toThrow();
  });

  const focusRoutes = names.filter(
    (f) => f.startsWith("focus-") && f !== "focus.json",
  );
  it.each(focusRoutes)("%s parses as a focus route", (file) => {
    expect(() => FocusRouteResponseSchema.parse(read(file))).not.toThrow();
  });
});
