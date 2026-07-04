import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from "vitest";
import { Webhook } from "svix";
import {
  prisma,
  truncate,
  ensureMigrated,
  createSubscription,
} from "@/tests/helpers/db";
import { POST as webhookPOST } from "@/app/api/webhooks/resend/route";

// Known Svix test secret — valid base64 so the Webhook constructor accepts it.
const SECRET = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
const URL = "https://example.test/api/webhooks/resend";

function bounceEvent(to: string, type: "hard" | "soft") {
  return {
    type: "email.bounced",
    data: { to: [to], bounce: { type } },
  };
}

function complaintEvent(to: string) {
  return { type: "email.complained", data: { to: [to] } };
}

// Build a POST Request signed with the given secret (defaults to the valid one).
function signedRequest(event: unknown, secret = SECRET): Request {
  const payload = JSON.stringify(event);
  const msgId = `msg_${Math.random().toString(36).slice(2)}`;
  const timestamp = new Date();
  const signature = new Webhook(secret).sign(msgId, timestamp, payload);
  return new Request(URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": msgId,
      "svix-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
      "svix-signature": signature,
    },
    body: payload,
  });
}

beforeAll(async () => {
  await ensureMigrated();
});

afterAll(async () => {
  delete process.env.RESEND_WEBHOOK_SECRET;
  await prisma.$disconnect();
});

beforeEach(async () => {
  await truncate();
  process.env.RESEND_WEBHOOK_SECRET = SECRET;
});

describe("POST /api/webhooks/resend — suppression (Feature D.13)", () => {
  it("marks bouncedAt on a hard bounce for a known address", async () => {
    await createSubscription({ email: "dead@example.com" });
    const res = await webhookPOST(
      signedRequest(bounceEvent("dead@example.com", "hard")),
    );
    expect(res.status).toBe(200);
    const row = await prisma.subscription.findUnique({
      where: { email: "dead@example.com" },
    });
    expect(row!.bouncedAt).not.toBeNull();
  });

  it("marks bouncedAt on a complaint", async () => {
    await createSubscription({ email: "spam@example.com" });
    const res = await webhookPOST(signedRequest(complaintEvent("spam@example.com")));
    expect(res.status).toBe(200);
    const row = await prisma.subscription.findUnique({
      where: { email: "spam@example.com" },
    });
    expect(row!.bouncedAt).not.toBeNull();
  });

  it("does NOT suppress on a soft bounce", async () => {
    await createSubscription({ email: "full@example.com" });
    const res = await webhookPOST(
      signedRequest(bounceEvent("full@example.com", "soft")),
    );
    expect(res.status).toBe(200);
    const row = await prisma.subscription.findUnique({
      where: { email: "full@example.com" },
    });
    expect(row!.bouncedAt).toBeNull();
  });

  it("normalizes the recipient email to lowercase before matching", async () => {
    await createSubscription({ email: "mixed@example.com" });
    const res = await webhookPOST(
      signedRequest(bounceEvent("Mixed@Example.com", "hard")),
    );
    expect(res.status).toBe(200);
    const row = await prisma.subscription.findUnique({
      where: { email: "mixed@example.com" },
    });
    expect(row!.bouncedAt).not.toBeNull();
  });

  it("ignores non-suppressing event types (e.g. email.delivered)", async () => {
    await createSubscription({ email: "ok@example.com" });
    const res = await webhookPOST(
      signedRequest({ type: "email.delivered", data: { to: ["ok@example.com"] } }),
    );
    expect(res.status).toBe(200);
    const row = await prisma.subscription.findUnique({
      where: { email: "ok@example.com" },
    });
    expect(row!.bouncedAt).toBeNull();
  });

  it("accepts a recipient delivered as a plain string (not array)", async () => {
    await createSubscription({ email: "str@example.com" });
    const res = await webhookPOST(
      signedRequest({ type: "email.complained", data: { to: "str@example.com" } }),
    );
    expect(res.status).toBe(200);
    const row = await prisma.subscription.findUnique({
      where: { email: "str@example.com" },
    });
    expect(row!.bouncedAt).not.toBeNull();
  });

  it("is a no-op (200) when the payload has no recipient", async () => {
    const res = await webhookPOST(
      signedRequest({ type: "email.bounced", data: { bounce: { type: "hard" } } }),
    );
    expect(res.status).toBe(200);
  });

  it("is a no-op (200) when the address is unknown", async () => {
    const res = await webhookPOST(
      signedRequest(bounceEvent("nobody@example.com", "hard")),
    );
    expect(res.status).toBe(200);
    const count = await prisma.subscription.count();
    expect(count).toBe(0);
  });

  it("is idempotent when the same event is delivered twice", async () => {
    await createSubscription({ email: "twice@example.com" });
    const first = await webhookPOST(
      signedRequest(bounceEvent("twice@example.com", "hard")),
    );
    expect(first.status).toBe(200);
    const afterFirst = await prisma.subscription.findUnique({
      where: { email: "twice@example.com" },
    });

    const second = await webhookPOST(
      signedRequest(bounceEvent("twice@example.com", "hard")),
    );
    expect(second.status).toBe(200);
    const afterSecond = await prisma.subscription.findUnique({
      where: { email: "twice@example.com" },
    });
    expect(afterFirst!.bouncedAt).not.toBeNull();
    expect(afterSecond!.bouncedAt).not.toBeNull();
  });
});

describe("POST /api/webhooks/resend — auth (Feature D.13)", () => {
  it("returns 401 when the signature does not verify", async () => {
    await createSubscription({ email: "dead@example.com" });
    const req = signedRequest(
      bounceEvent("dead@example.com", "hard"),
      "whsec_aW52YWxpZHNlY3JldGludmFsaWRzZWNyZXQ=", // different secret
    );
    const res = await webhookPOST(req);
    expect(res.status).toBe(401);
    const row = await prisma.subscription.findUnique({
      where: { email: "dead@example.com" },
    });
    expect(row!.bouncedAt).toBeNull();
  });

  it("returns 500 when RESEND_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    const res = await webhookPOST(
      signedRequest(bounceEvent("dead@example.com", "hard")),
    );
    expect(res.status).toBe(500);
  });
});
