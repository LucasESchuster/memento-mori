import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import {
  installResendMock,
  resetSentEmails,
  getSentEmails,
  failNextSend,
} from "@/tests/helpers/resend";

installResendMock();

import {
  prisma,
  truncate,
  ensureMigrated,
  createSubscription,
} from "@/tests/helpers/db";
import { makeJsonRequest, makeRawRequest } from "@/tests/helpers/request";

// Import route under test (and rate-limit reset) after mock install.
import {
  POST as subscribePOST,
  __resetRateLimit,
} from "@/app/api/subscribe/route";

beforeAll(async () => {
  await ensureMigrated();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await truncate();
  resetSentEmails();
  __resetRateLimit();
});

function subscribe(body: unknown, headers: Record<string, string> = {}) {
  return subscribePOST(
    makeJsonRequest("https://example.test/api/subscribe", "POST", body, {
      "x-forwarded-for": "1.2.3.4",
      ...headers,
    }),
  );
}

describe("POST /api/subscribe — happy path (Feature B.7)", () => {
  it("creates a pending subscription and returns 201 confirmation_sent", async () => {
    const res = await subscribe({
      email: "user@example.com",
      birthDate: "1990-05-15",
      lifeExpectancy: 80,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("confirmation_sent");
    expect(typeof body.id).toBe("string");

    const row = await prisma.subscription.findUnique({
      where: { email: "user@example.com" },
    });
    expect(row).not.toBeNull();
    expect(row!.confirmToken).toMatch(/^[0-9a-f]{64}$/);
    expect(row!.unsubscribeToken).toMatch(/^[0-9a-f]{64}$/);
    expect(row!.confirmedAt).toBeNull();
    expect(row!.unsubscribedAt).toBeNull();

    const sent = getSentEmails();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("user@example.com");
    expect(sent[0].subject).toBe("Confirme sua inscrição — Memento Mori");
  });

  it("lowercases the email before DB write", async () => {
    const res = await subscribe({
      email: "Foo@BAR.com",
      birthDate: "1990-05-15",
      lifeExpectancy: 80,
    });
    expect(res.status).toBe(201);
    const row = await prisma.subscription.findUnique({
      where: { email: "foo@bar.com" },
    });
    expect(row).not.toBeNull();
    expect(row!.email).toBe("foo@bar.com");
  });
});

describe("POST /api/subscribe — re-subscribe variants (Feature B.7)", () => {
  it("re-subscribes a previously cancelled user: preserves unsubscribeToken, resets state", async () => {
    const original = await createSubscription({
      email: "return@example.com",
      unsubscribedAt: new Date("2026-01-01T00:00:00Z"),
      lastSentWeek: 100,
      lastSentAt: new Date("2026-01-01T00:00:00Z"),
    });

    const res = await subscribe({
      email: "return@example.com",
      birthDate: "1990-05-15",
      lifeExpectancy: 85,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("confirmation_sent");

    const row = await prisma.subscription.findUnique({
      where: { email: "return@example.com" },
    });
    expect(row!.id).toBe(original.id);
    expect(row!.unsubscribeToken).toBe(original.unsubscribeToken);
    expect(row!.confirmToken).not.toBe(original.confirmToken);
    expect(row!.confirmedAt).toBeNull();
    expect(row!.unsubscribedAt).toBeNull();
    expect(row!.lastSentWeek).toBe(0);
    expect(row!.lastSentAt).toBeNull();
    expect(row!.lifeExpectancy).toBe(85);
  });

  it("re-subscribes a still-pending user with the same id and a fresh confirmToken", async () => {
    const pending = await createSubscription({
      email: "pending@example.com",
      confirmedAt: null,
      confirmToken: "oldtoken",
    });

    const res = await subscribe({
      email: "pending@example.com",
      birthDate: "1992-02-02",
      lifeExpectancy: 80,
    });
    expect(res.status).toBe(200);
    const row = await prisma.subscription.findUnique({
      where: { email: "pending@example.com" },
    });
    expect(row!.id).toBe(pending.id);
    expect(row!.confirmToken).not.toBe("oldtoken");
  });

  it("short-circuits when already confirmed + active and does not send another email", async () => {
    await createSubscription({
      email: "active@example.com",
      confirmedAt: new Date("2026-01-01T00:00:00Z"),
      unsubscribedAt: null,
    });

    const res = await subscribe({
      email: "active@example.com",
      birthDate: "1990-05-15",
      lifeExpectancy: 80,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("already_subscribed");
    expect(getSentEmails()).toHaveLength(0);
  });
});

describe("POST /api/subscribe — validation (Feature B.7)", () => {
  it("returns 400 invalid_json for malformed JSON", async () => {
    const req = makeRawRequest(
      "https://example.test/api/subscribe",
      "POST",
      "not-json",
      { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
    );
    const res = await subscribePOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_json");
  });

  it("returns 400 invalid_input on bad email", async () => {
    const res = await subscribe({
      email: "not-an-email",
      birthDate: "1990-05-15",
      lifeExpectancy: 80,
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_input");
    expect(Array.isArray(body.issues)).toBe(true);
  });

  it.each([50, 101])(
    "returns 400 invalid_input for lifeExpectancy out of range: %i",
    async (le) => {
      const res = await subscribe({
        email: "user@example.com",
        birthDate: "1990-05-15",
        lifeExpectancy: le,
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("invalid_input");
    },
  );

  it("returns 400 invalid_input for non-ISO birthDate", async () => {
    const res = await subscribe({
      email: "user@example.com",
      birthDate: "15/05/1990",
      lifeExpectancy: 80,
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/subscribe — rate limiting (Feature B.7)", () => {
  it("blocks the 6th request from the same IP within the window", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await subscribe({
        email: `u${i}@example.com`,
        birthDate: "1990-05-15",
        lifeExpectancy: 80,
      });
      expect(r.status).toBe(201);
    }
    const blocked = await subscribe({
      email: "u6@example.com",
      birthDate: "1990-05-15",
      lifeExpectancy: 80,
    });
    expect(blocked.status).toBe(429);
    const body = await blocked.json();
    expect(body.error).toBe("too_many_requests");
  });

  it("counts IPs independently", async () => {
    for (let i = 0; i < 5; i++) {
      await subscribe(
        {
          email: `a${i}@example.com`,
          birthDate: "1990-05-15",
          lifeExpectancy: 80,
        },
        { "x-forwarded-for": "10.0.0.1" },
      );
    }
    const otherIp = await subscribe(
      {
        email: "b@example.com",
        birthDate: "1990-05-15",
        lifeExpectancy: 80,
      },
      { "x-forwarded-for": "10.0.0.2" },
    );
    expect(otherIp.status).toBe(201);
  });
});

describe("POST /api/subscribe — IP extraction (Feature B.7)", () => {
  it("uses first entry of x-forwarded-for", async () => {
    // 5 calls with a CSV x-forwarded-for from the same "first" IP exhaust the limit.
    for (let i = 0; i < 5; i++) {
      await subscribePOST(
        makeJsonRequest(
          "https://example.test/api/subscribe",
          "POST",
          {
            email: `x${i}@example.com`,
            birthDate: "1990-05-15",
            lifeExpectancy: 80,
          },
          { "x-forwarded-for": "9.9.9.9, 10.0.0.5" },
        ),
      );
    }
    // 6th call still uses the same first-IP bucket → 429.
    const blocked = await subscribePOST(
      makeJsonRequest(
        "https://example.test/api/subscribe",
        "POST",
        {
          email: "x6@example.com",
          birthDate: "1990-05-15",
          lifeExpectancy: 80,
        },
        { "x-forwarded-for": "9.9.9.9, 77.77.77.77" },
      ),
    );
    expect(blocked.status).toBe(429);
  });

  it("falls back to x-real-ip when no x-forwarded-for", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await subscribePOST(
        makeJsonRequest(
          "https://example.test/api/subscribe",
          "POST",
          {
            email: `r${i}@example.com`,
            birthDate: "1990-05-15",
            lifeExpectancy: 80,
          },
          { "x-real-ip": "7.7.7.7" },
        ),
      );
      expect(r.status).toBe(201);
    }
    const blocked = await subscribePOST(
      makeJsonRequest(
        "https://example.test/api/subscribe",
        "POST",
        {
          email: "r6@example.com",
          birthDate: "1990-05-15",
          lifeExpectancy: 80,
        },
        { "x-real-ip": "7.7.7.7" },
      ),
    );
    expect(blocked.status).toBe(429);
  });

  it("falls back to 'unknown' when neither header is present", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await subscribePOST(
        new Request("https://example.test/api/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: `n${i}@example.com`,
            birthDate: "1990-05-15",
            lifeExpectancy: 80,
          }),
        }),
      );
      expect(r.status).toBe(201);
    }
    const blocked = await subscribePOST(
      new Request("https://example.test/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "n6@example.com",
          birthDate: "1990-05-15",
          lifeExpectancy: 80,
        }),
      }),
    );
    expect(blocked.status).toBe(429);
  });
});

describe("POST /api/subscribe — email send failure (Feature B.7)", () => {
  // Current behavior: the DB row IS created before the send attempt, and failure
  // does not roll it back. This test documents that; do not treat as a bug fix target.
  it("returns 500 email_send_failed but still creates the row", async () => {
    failNextSend(1);
    const res = await subscribe({
      email: "fail@example.com",
      birthDate: "1990-05-15",
      lifeExpectancy: 80,
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("email_send_failed");

    const row = await prisma.subscription.findUnique({
      where: { email: "fail@example.com" },
    });
    expect(row).not.toBeNull();
    expect(row!.confirmToken).not.toBeNull();
  });
});
