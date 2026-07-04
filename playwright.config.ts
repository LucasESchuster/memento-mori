import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        process.env.DATABASE_URL ??
        "postgresql://memento:memento@localhost:5432/memento_mori_test",
      RESEND_API_KEY: "test_resend_key",
      EMAIL_FROM: "tests@example.com",
      APP_URL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
      NODE_ENV: "development",
      // Force Turnstile off so the flow is deterministic regardless of a local
      // .env: no site key hides the widget, no secret makes verify fail-open.
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      TURNSTILE_SECRET_KEY: "",
    },
  },
});
