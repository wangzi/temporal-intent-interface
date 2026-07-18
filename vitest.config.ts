import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Node environment: the seeded tests cover pure logic and the engine
    // contract, not DOM. Add environment: "jsdom" when a component test lands.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
