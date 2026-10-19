import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/trades/**/*.ts", "src/lib/settings/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/lib/trades/types.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
