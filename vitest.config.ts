import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "tests/unit/**/*.test.ts",
      "tests/integration/**/*.test.ts",
      "tests/dom/**/*.test.{ts,tsx}",
    ],
    exclude: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "tests/e2e/**",
      "tests/helpers/**",
    ],
    environmentMatchGlobs: [
      ["tests/dom/**", "jsdom"],
      ["tests/unit/**", "node"],
      ["tests/integration/**", "node"],
    ],
    // Integration and DOM tests share module state (Prisma client, Resend
    // mock, rate-limit map). Run test files serially; tests inside a file
    // still run in order by default.
    fileParallelism: false,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["lib/**", "app/api/**", "scripts/**", "components/**"],
      exclude: [
        "components/ui/**",
        "**/*.d.ts",
        "tests/**",
      ],
      thresholds: {
        "lib/**": { statements: 90, branches: 85, functions: 85, lines: 90 },
        "app/api/**": { statements: 90, branches: 85, functions: 85, lines: 90 },
        "scripts/**": { statements: 90, branches: 85, functions: 85, lines: 90 },
        "components/**": { statements: 80, branches: 70, functions: 75, lines: 80 },
      },
    },
  },
});
