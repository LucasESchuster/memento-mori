import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

process.env.RESEND_API_KEY = process.env.RESEND_API_KEY ?? "test_resend_key";
process.env.EMAIL_FROM = process.env.EMAIL_FROM ?? "tests@example.com";
process.env.APP_URL = process.env.APP_URL ?? "https://example.test";

const FAKE_NOW = new Date("2026-04-19T12:00:00Z");

// jsdom polyfills required by Radix UI primitives (Slider).
if (typeof globalThis.ResizeObserver === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (
  typeof globalThis.window !== "undefined" &&
  typeof globalThis.window.HTMLElement !== "undefined"
) {
  // Radix UI sometimes checks for pointer APIs that jsdom does not implement.
  if (!globalThis.window.HTMLElement.prototype.hasPointerCapture) {
    globalThis.window.HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!globalThis.window.HTMLElement.prototype.releasePointerCapture) {
    globalThis.window.HTMLElement.prototype.releasePointerCapture = () => {};
  }
  if (!globalThis.window.HTMLElement.prototype.scrollIntoView) {
    globalThis.window.HTMLElement.prototype.scrollIntoView = () => {};
  }
}

beforeEach(() => {
  // Only fake Date — keep real timers so userEvent / setImmediate / Resend still work.
  vi.useFakeTimers({
    shouldAdvanceTime: true,
    toFake: ["Date"],
  });
  vi.setSystemTime(FAKE_NOW);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
