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
  GET as unsubscribeGET,
  POST as unsubscribePOST,
} from "@/app/api/unsubscribe/route";
import { makeFormRequest, makeJsonRequest } from "@/tests/helpers/request";

beforeAll(async () => {
  await ensureMigrated();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await truncate();
});

describe("/api/unsubscribe (Feature B.9)", () => {
  it("GET without token → 'Token inválido ou ausente.'", async () => {
    const res = await unsubscribeGET(
      new Request("https://example.test/api/unsubscribe"),
    );
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toContain("Token inválido ou ausente.");
  });

  it("GET with unknown token → 'Link de cancelamento inválido.'", async () => {
    const res = await unsubscribeGET(
      new Request("https://example.test/api/unsubscribe?token=nope"),
    );
    const text = await res.text();
    expect(text).toContain("Link de cancelamento inválido.");
  });

  it("GET with valid token cancels and shows 'inscrição cancelada.'", async () => {
    const sub = await createSubscription({
      email: "bye@example.com",
      unsubscribeToken: "unsub_tok",
    });
    const res = await unsubscribeGET(
      new Request("https://example.test/api/unsubscribe?token=unsub_tok"),
    );
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toContain(
      "Você não receberá mais lembretes. Memento vivere — lembre-se também de viver.",
    );
    const row = await prisma.subscription.findUnique({ where: { id: sub.id } });
    expect(row!.unsubscribedAt).not.toBeNull();
  });

  it("POST with form-urlencoded body (one-click) cancels", async () => {
    const sub = await createSubscription({
      email: "oneclick@example.com",
      unsubscribeToken: "oc_tok",
    });
    const res = await unsubscribePOST(
      makeFormRequest("https://example.test/api/unsubscribe", "POST", {
        token: "oc_tok",
      }),
    );
    const text = await res.text();
    expect(text).toContain("inscrição cancelada");
    const row = await prisma.subscription.findUnique({ where: { id: sub.id } });
    expect(row!.unsubscribedAt).not.toBeNull();
  });

  it("POST with JSON content-type falls back to query-string token", async () => {
    const sub = await createSubscription({
      email: "json@example.com",
      unsubscribeToken: "json_tok",
    });
    const res = await unsubscribePOST(
      makeJsonRequest(
        "https://example.test/api/unsubscribe?token=json_tok",
        "POST",
        {},
      ),
    );
    const text = await res.text();
    expect(text).toContain("inscrição cancelada");
    const row = await prisma.subscription.findUnique({ where: { id: sub.id } });
    expect(row!.unsubscribedAt).not.toBeNull();
  });

  it("is idempotent: second unsubscribe keeps the original unsubscribedAt", async () => {
    const sub = await createSubscription({
      email: "idempo@example.com",
      unsubscribeToken: "idemp_tok",
    });
    await unsubscribeGET(
      new Request("https://example.test/api/unsubscribe?token=idemp_tok"),
    );
    const first = await prisma.subscription.findUnique({
      where: { id: sub.id },
    });
    const firstAt = first!.unsubscribedAt!.getTime();
    await unsubscribeGET(
      new Request("https://example.test/api/unsubscribe?token=idemp_tok"),
    );
    const second = await prisma.subscription.findUnique({
      where: { id: sub.id },
    });
    expect(second!.unsubscribedAt!.getTime()).toBe(firstAt);
  });
});
