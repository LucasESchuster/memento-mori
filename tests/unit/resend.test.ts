import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  installResendMock,
  resetSentEmails,
  getSentEmails,
  getConstructorCalls,
} from "@/tests/helpers/resend";

installResendMock();

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetSentEmails();
  vi.resetModules();
  process.env.RESEND_API_KEY = "test_resend_key";
  process.env.EMAIL_FROM = "tests@example.com";
  process.env.APP_URL = "https://example.test";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("sendConfirmEmail (Feature C.12)", () => {
  it("sends an email with rendered HTML + plaintext and the correct subject", async () => {
    const { sendConfirmEmail } = await import("@/lib/resend");
    await sendConfirmEmail({ to: "user@example.com", confirmToken: "tok123" });
    const sent = getSentEmails();
    expect(sent).toHaveLength(1);
    const [mail] = sent;
    expect(mail.from).toBe("tests@example.com");
    expect(mail.to).toBe("user@example.com");
    expect(mail.subject).toBe("Confirme sua inscrição — Memento Mori");
    expect(mail.html).toContain(
      "https://example.test/api/confirm?token=tok123",
    );
    expect(mail.html).toContain("Memento Mori");
    expect(mail.text).toBeTruthy();
    expect(mail.text!.length).toBeGreaterThan(0);
    expect(mail.text).toContain("tok123");
  });
});

describe("sendWeeklyEmail (Feature C.12)", () => {
  it("renders URLs, pt-BR week numbers, quote, and sets List-Unsubscribe headers", async () => {
    const { sendWeeklyEmail } = await import("@/lib/resend");
    await sendWeeklyEmail({
      to: "user@example.com",
      currentWeek: 1872,
      totalWeeks: 4160,
      stats: {
        yearsLived: 35,
        yearsRemaining: 45,
        weeksLived: 1872,
        weeksRemaining: 2288,
        daysRemaining: 16425,
        percentLived: 45,
        totalWeeks: 4160,
      },
      quote: { text: "Tempus fugit.", author: "Virgílio" },
      unsubscribeToken: "unsub123",
    });
    const [mail] = getSentEmails();
    expect(mail.subject).toBe(
      `Semana ${(1872).toLocaleString("pt-BR")} — memento mori.`,
    );
    expect(mail.html).toContain(
      "https://example.test/api/unsubscribe?token=unsub123",
    );
    expect(mail.html).toContain("https://example.test/edit?token=unsub123");
    expect(mail.html).toContain("https://example.test");
    // pt-BR formatted numbers use dots as thousands separators.
    expect(mail.html).toContain((1872).toLocaleString("pt-BR"));
    expect(mail.html).toContain((4160).toLocaleString("pt-BR"));
    expect(mail.html).toContain("Tempus fugit.");
    expect(mail.html).toContain("Virgílio");
    expect(mail.headers).toBeTruthy();
    expect(mail.headers!["List-Unsubscribe"]).toBe(
      "<https://example.test/api/unsubscribe?token=unsub123>",
    );
    expect(mail.headers!["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click",
    );
    expect(mail.text).toBeTruthy();
    expect(mail.text!.length).toBeGreaterThan(0);
  });
});

describe("Resend client caching (Feature C.12)", () => {
  it("constructs `new Resend()` exactly once across multiple sends", async () => {
    const { sendConfirmEmail, sendWeeklyEmail } = await import("@/lib/resend");
    const before = getConstructorCalls().length;
    await sendConfirmEmail({ to: "a@example.com", confirmToken: "t1" });
    await sendConfirmEmail({ to: "b@example.com", confirmToken: "t2" });
    await sendWeeklyEmail({
      to: "c@example.com",
      currentWeek: 1,
      totalWeeks: 4160,
      stats: {
        yearsLived: 0,
        yearsRemaining: 80,
        weeksLived: 1,
        weeksRemaining: 4159,
        daysRemaining: 29220,
        percentLived: 0,
        totalWeeks: 4160,
      },
      quote: { text: "q", author: "a" },
      unsubscribeToken: "u",
    });
    const after = getConstructorCalls().length;
    expect(after - before).toBe(1);
  });
});

describe("requireEnv (Feature C.12)", () => {
  it("throws when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendConfirmEmail } = await import("@/lib/resend");
    await expect(
      sendConfirmEmail({ to: "x@example.com", confirmToken: "t" }),
    ).rejects.toThrow(/RESEND_API_KEY is not set/);
  });

  it("throws when EMAIL_FROM is missing", async () => {
    delete process.env.EMAIL_FROM;
    const { sendConfirmEmail } = await import("@/lib/resend");
    await expect(
      sendConfirmEmail({ to: "x@example.com", confirmToken: "t" }),
    ).rejects.toThrow(/EMAIL_FROM is not set/);
  });

  it("throws when APP_URL is missing", async () => {
    delete process.env.APP_URL;
    const { sendConfirmEmail } = await import("@/lib/resend");
    await expect(
      sendConfirmEmail({ to: "x@example.com", confirmToken: "t" }),
    ).rejects.toThrow(/APP_URL is not set/);
  });
});
