import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { installResendMock } from "@/tests/helpers/resend";
installResendMock();

import {
  prisma,
  truncate,
  ensureMigrated,
  createSubscription,
} from "@/tests/helpers/db";
import {
  GET as subscriptionGET,
  PATCH as subscriptionPATCH,
} from "@/app/api/subscription/route";
import { makeJsonRequest, makeRawRequest } from "@/tests/helpers/request";

beforeAll(async () => {
  await ensureMigrated();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await truncate();
});

describe("GET /api/subscription (Feature B.10)", () => {
  it("returns 400 missing_token when no token", async () => {
    const res = await subscriptionGET(
      new Request("https://example.test/api/subscription"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("missing_token");
  });

  it("returns 404 not_found for unknown token", async () => {
    const res = await subscriptionGET(
      new Request("https://example.test/api/subscription?token=nope"),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("not_found");
  });

  it("returns the subscription shape with YYYY-MM-DD birthDate and unsubscribed flag", async () => {
    await createSubscription({
      email: "me@example.com",
      birthDate: new Date("1990-05-15T00:00:00Z"),
      lifeExpectancy: 82,
      unsubscribeToken: "get_tok",
      unsubscribedAt: null,
    });
    const res = await subscriptionGET(
      new Request("https://example.test/api/subscription?token=get_tok"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      email: "me@example.com",
      birthDate: "1990-05-15",
      lifeExpectancy: 82,
      unsubscribed: false,
    });
    expect(body.birthDate).not.toContain("T");
  });

  it("reports unsubscribed: true when the row is cancelled", async () => {
    await createSubscription({
      email: "gone@example.com",
      unsubscribeToken: "gone_tok",
      unsubscribedAt: new Date("2026-02-01T00:00:00Z"),
    });
    const res = await subscriptionGET(
      new Request("https://example.test/api/subscription?token=gone_tok"),
    );
    const body = await res.json();
    expect(body.unsubscribed).toBe(true);
  });
});

describe("PATCH /api/subscription (Feature B.11)", () => {
  it("returns 400 when token is missing", async () => {
    const res = await subscriptionPATCH(
      makeJsonRequest("https://example.test/api/subscription", "PATCH", {
        birthDate: "1990-05-15",
        lifeExpectancy: 80,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("missing_token");
  });

  it("returns 404 when token does not match any row", async () => {
    const res = await subscriptionPATCH(
      makeJsonRequest(
        "https://example.test/api/subscription?token=xxxxxx",
        "PATCH",
        { birthDate: "1990-05-15", lifeExpectancy: 80 },
      ),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 invalid_json for malformed body", async () => {
    await createSubscription({ unsubscribeToken: "patch_tok" });
    const res = await subscriptionPATCH(
      makeRawRequest(
        "https://example.test/api/subscription?token=patch_tok",
        "PATCH",
        "not-json",
        { "content-type": "application/json" },
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_json");
  });

  it.each([
    { birthDate: "not-a-date", lifeExpectancy: 80 },
    { birthDate: "1990-05-15", lifeExpectancy: 50 },
    { birthDate: "1990-05-15", lifeExpectancy: 101 },
    { birthDate: "1990-05-15", lifeExpectancy: 80.5 },
  ])("returns 400 invalid_input for %j", async (body) => {
    await createSubscription({ unsubscribeToken: "pv_tok" });
    const res = await subscriptionPATCH(
      makeJsonRequest(
        "https://example.test/api/subscription?token=pv_tok",
        "PATCH",
        body,
      ),
    );
    expect(res.status).toBe(400);
    const out = await res.json();
    expect(out.error).toBe("invalid_input");
  });

  it("updates birthDate and lifeExpectancy, leaves immutable fields untouched", async () => {
    const original = await createSubscription({
      email: "edit@example.com",
      unsubscribeToken: "up_tok",
      confirmedAt: new Date("2026-01-01T00:00:00Z"),
      lastSentWeek: 42,
    });
    const res = await subscriptionPATCH(
      makeJsonRequest(
        "https://example.test/api/subscription?token=up_tok",
        "PATCH",
        { birthDate: "1985-07-20", lifeExpectancy: 90 },
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("updated");

    const row = await prisma.subscription.findUnique({
      where: { id: original.id },
    });
    expect(row!.lifeExpectancy).toBe(90);
    expect(row!.birthDate.toISOString().split("T")[0]).toBe("1985-07-20");
    expect(row!.email).toBe(original.email);
    expect(row!.unsubscribeToken).toBe(original.unsubscribeToken);
    expect(row!.confirmedAt).not.toBeNull();
    expect(row!.lastSentWeek).toBe(42);
  });

  // Current (possibly imperfect) behavior: PATCH succeeds on unsubscribed rows.
  it("PATCH on an already-unsubscribed row still succeeds (documenting current behavior)", async () => {
    const original = await createSubscription({
      unsubscribeToken: "un_tok",
      unsubscribedAt: new Date("2026-02-01T00:00:00Z"),
    });
    const res = await subscriptionPATCH(
      makeJsonRequest(
        "https://example.test/api/subscription?token=un_tok",
        "PATCH",
        { birthDate: "1990-05-15", lifeExpectancy: 80 },
      ),
    );
    expect(res.status).toBe(200);
    const row = await prisma.subscription.findUnique({
      where: { id: original.id },
    });
    expect(row!.unsubscribedAt).not.toBeNull();
  });
});
