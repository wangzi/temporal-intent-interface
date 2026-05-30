import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

// Local fixture loader for JOURNALKIT_FIXTURE_MODE. Files live next
// to this module at ./fixtures/*.json. Returns parsed JSON or null
// when the named fixture doesn't exist.
//
// Path resolution uses __dirname-equivalent via import.meta.url so
// the loader works in both Next.js dev and the standalone build.

const FIXTURE_DIR = path.join(
  process.cwd(),
  "src",
  "lib",
  "engine",
  "fixtures",
);

export async function fixtureGet(name: string): Promise<unknown | null> {
  const file = path.join(FIXTURE_DIR, `${name}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw err;
  }
}
