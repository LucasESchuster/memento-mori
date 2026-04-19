import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { installResendMock } from "@/tests/helpers/resend";
installResendMock();

import {
  prisma,
  truncate,
  ensureMigrated,
  createSubscription,
} from "@/tests/helpers/db";
import { GET as confirmGET } from "@/app/api/confirm/route";

beforeAll(async () => {
  await ensureMigrated();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await truncate();
});

async function hit(url: string) {
  const res = await confirmGET(new Request(url));
  const text = await res.text();
  return { res, text };
}

describe("GET /api/confirm (Feature B.8)", () => {
  it("returns HTML with 'Token inválido ou ausente.' when token is missing", async () => {
    const { res, text } = await hit("https://example.test/api/confirm");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(text).toContain("Token inválido ou ausente.");
  });

  it("returns HTML rejection for an unknown token", async () => {
    const { res, text } = await hit(
      "https://example.test/api/confirm?token=does-not-exist",
    );
    expect(res.status).toBe(200);
    expect(text).toContain(
      "Este link de confirmação não é válido ou já foi utilizado.",
    );
  });

  it("confirms a valid pending row, sets confirmedAt, and nulls confirmToken", async () => {
    const sub = await createSubscription({
      email: "pending@example.com",
      confirmedAt: null,
      confirmToken: "valid_confirm_token",
    });

    const { res, text } = await hit(
      "https://example.test/api/confirm?token=valid_confirm_token",
    );
    expect(res.status).toBe(200);
    expect(text).toContain("Inscrição confirmada");

    const row = await prisma.subscription.findUnique({ where: { id: sub.id } });
    expect(row!.confirmedAt).not.toBeNull();
    expect(row!.confirmToken).toBeNull();
  });

  it("a second confirm visit on an already-confirmed row shows 'você já está inscrito'", async () => {
    // Setup: create a row with confirmToken still present (simulating a direct replay before null).
    await createSubscription({
      email: "already@example.com",
      confirmToken: "replay_token",
      confirmedAt: new Date("2026-01-01T00:00:00Z"),
    });
    const { res, text } = await hit(
      "https://example.test/api/confirm?token=replay_token",
    );
    expect(res.status).toBe(200);
    expect(text).toContain("você já está inscrito");
  });

  it("rejects a once-consumed token because it was nulled", async () => {
    await createSubscription({
      email: "consume@example.com",
      confirmedAt: null,
      confirmToken: "one_shot",
    });
    await hit("https://example.test/api/confirm?token=one_shot");
    const { text } = await hit("https://example.test/api/confirm?token=one_shot");
    expect(text).toContain(
      "Este link de confirmação não é válido ou já foi utilizado.",
    );
  });
});
