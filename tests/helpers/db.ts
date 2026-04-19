import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { randomToken } from "@/lib/tokens";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL (or DATABASE_URL) must be set for integration tests.",
  );
}

process.env.DATABASE_URL = TEST_DATABASE_URL;

export const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
  log: ["error"],
});

let migrated = false;
export async function ensureMigrated(): Promise<void> {
  if (migrated) return;
  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: "ignore",
    });
  } catch (err) {
    console.error("[tests/helpers/db] prisma migrate deploy failed", err);
    throw err;
  }
  migrated = true;
}

export async function truncate(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Subscription" RESTART IDENTITY CASCADE',
  );
}

export type SubscriptionOverrides = Partial<{
  email: string;
  birthDate: Date;
  lifeExpectancy: number;
  unsubscribeToken: string;
  confirmToken: string | null;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  lastSentWeek: number;
  lastSentAt: Date | null;
}>;

let emailCounter = 0;
function uniqueEmail(): string {
  emailCounter += 1;
  return `user${Date.now()}_${emailCounter}@example.test`;
}

export async function createSubscription(overrides: SubscriptionOverrides = {}) {
  const data = {
    email: overrides.email ?? uniqueEmail(),
    birthDate: overrides.birthDate ?? new Date("1990-01-01T00:00:00Z"),
    lifeExpectancy: overrides.lifeExpectancy ?? 80,
    unsubscribeToken: overrides.unsubscribeToken ?? randomToken(),
    confirmToken:
      overrides.confirmToken === undefined ? null : overrides.confirmToken,
    confirmedAt:
      overrides.confirmedAt === undefined
        ? new Date("2026-01-01T00:00:00Z")
        : overrides.confirmedAt,
    unsubscribedAt:
      overrides.unsubscribedAt === undefined ? null : overrides.unsubscribedAt,
    lastSentWeek: overrides.lastSentWeek ?? 0,
    lastSentAt:
      overrides.lastSentAt === undefined ? null : overrides.lastSentAt,
  };

  return prisma.subscription.create({ data });
}
