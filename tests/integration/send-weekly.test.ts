import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from "vitest";
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
import { weekOfLife } from "@/lib/weeks";

const NOW = new Date("2026-04-19T12:00:00Z");
// A birth 30 years before NOW gives a comfortable current week below lifeExpectancy.
const BIRTH_30Y = new Date(NOW.getTime() - 30 * 365.25 * 86_400_000);

beforeAll(async () => {
  await ensureMigrated();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await truncate();
  resetSentEmails();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function runSendWeekly(): Promise<number> {
  let exitResolve!: (code: number) => void;
  const exitPromise = new Promise<number>((r) => {
    exitResolve = r;
  });
  const exitSpy = vi.spyOn(process, "exit").mockImplementation(
    ((code?: number) => {
      exitResolve(code ?? 0);
      return undefined as never;
    }) as typeof process.exit,
  );
  vi.resetModules();
  await import("@/scripts/send-weekly");
  const code = await exitPromise;
  exitSpy.mockRestore();
  return code;
}

describe("scripts/send-weekly.ts (Feature D.13)", () => {
  it("sends to an eligible confirmed active subscription and updates lastSentWeek/lastSentAt", async () => {
    const sub = await createSubscription({
      email: "eligible@example.com",
      birthDate: BIRTH_30Y,
      lifeExpectancy: 80,
      lastSentWeek: 0,
    });
    const expectedWeek = weekOfLife(BIRTH_30Y, NOW);
    expect(expectedWeek).toBeGreaterThan(0);

    await runSendWeekly();

    const sent = getSentEmails();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("eligible@example.com");

    const row = await prisma.subscription.findUnique({ where: { id: sub.id } });
    expect(row!.lastSentWeek).toBe(expectedWeek);
    expect(row!.lastSentAt).not.toBeNull();
  });

  it("skips a row where currentWeek <= lastSentWeek", async () => {
    const expectedWeek = weekOfLife(BIRTH_30Y, NOW);
    await createSubscription({
      email: "already-sent@example.com",
      birthDate: BIRTH_30Y,
      lifeExpectancy: 80,
      lastSentWeek: expectedWeek,
    });
    await runSendWeekly();
    expect(getSentEmails()).toHaveLength(0);
  });

  it("skips a row whose currentWeek >= totalWeeks (end of life)", async () => {
    // 200 years back: currentWeek (~10400) >= totalWeeks (= 80*52 = 4160).
    const BIRTH_200Y = new Date(NOW.getTime() - 200 * 365.25 * 86_400_000);
    await createSubscription({
      email: "ancient@example.com",
      birthDate: BIRTH_200Y,
      lifeExpectancy: 80,
    });
    await runSendWeekly();
    expect(getSentEmails()).toHaveLength(0);
  });

  it("skips unconfirmed and unsubscribed rows (filtered by findMany)", async () => {
    await createSubscription({
      email: "unconfirmed@example.com",
      birthDate: BIRTH_30Y,
      confirmedAt: null,
      confirmToken: "pending",
    });
    await createSubscription({
      email: "cancelled@example.com",
      birthDate: BIRTH_30Y,
      unsubscribedAt: new Date("2026-01-01T00:00:00Z"),
    });
    await runSendWeekly();
    expect(getSentEmails()).toHaveLength(0);
  });

  it("does not halt on a single failure; other rows still processed", async () => {
    await createSubscription({
      email: "will-fail@example.com",
      birthDate: BIRTH_30Y,
      lifeExpectancy: 80,
    });
    await createSubscription({
      email: "will-succeed@example.com",
      birthDate: BIRTH_30Y,
      lifeExpectancy: 80,
    });
    failNextSend(1);
    await runSendWeekly();

    const sent = getSentEmails();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("will-succeed@example.com");

    const rows = await prisma.subscription.findMany({
      orderBy: { email: "asc" },
    });
    const failed = rows.find((r) => r.email === "will-fail@example.com")!;
    const ok = rows.find((r) => r.email === "will-succeed@example.com")!;
    expect(failed.lastSentWeek).toBe(0);
    expect(failed.lastSentAt).toBeNull();
    expect(ok.lastSentWeek).toBeGreaterThan(0);
    expect(ok.lastSentAt).not.toBeNull();
  });

  it("is idempotent when run twice back-to-back", async () => {
    await createSubscription({
      email: "twice@example.com",
      birthDate: BIRTH_30Y,
      lifeExpectancy: 80,
    });
    await runSendWeekly();
    expect(getSentEmails()).toHaveLength(1);
    resetSentEmails();
    await runSendWeekly();
    expect(getSentEmails()).toHaveLength(0);
  });
});
