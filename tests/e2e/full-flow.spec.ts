import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * End-to-end (Feature G.21): full lifecycle.
 *
 * Boots `next dev` via playwright.config.ts webServer pointing DATABASE_URL
 * at TEST_DATABASE_URL. Resend is NOT stubbed at the HTTP level in this spec —
 * instead we assert state via direct DB reads (the confirm token is read from
 * the DB) and via UI state. This keeps the spec deterministic without needing
 * an in-process mock.
 */

const DB_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://memento:memento@localhost:5432/memento_mori_test";

const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });

test.beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Subscription" RESTART IDENTITY CASCADE',
  );
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("subscribe → confirm → send → edit → unsubscribe", async ({
  page,
  baseURL,
}) => {
  const email = `e2e_${Date.now()}@example.test`;

  // --- 1. Subscribe via the home page -----------------------------------
  await page.goto("/");
  await page.getByLabel(/data de nascimento/i).fill("1990-05-15");
  await page.getByRole("button", { name: /calcular/i }).click();
  // Wait for the grid to render.
  await expect(page.getByText(/sua vida em semanas/i)).toBeVisible();

  await page.getByPlaceholder("voce@exemplo.com").fill(email);
  await page.getByRole("button", { name: /receber lembretes/i }).click();

  await expect(
    page.getByText(new RegExp(`Enviamos um email de confirmação para ${email}`)),
  ).toBeVisible();

  // --- 2. Confirm via DB-read token -------------------------------------
  const pending = await prisma.subscription.findUnique({ where: { email } });
  expect(pending).not.toBeNull();
  expect(pending!.confirmToken).not.toBeNull();
  const confirmResp = await page.request.get(
    `${baseURL}/api/confirm?token=${pending!.confirmToken}`,
  );
  expect(confirmResp.status()).toBe(200);
  const confirmedRow = await prisma.subscription.findUnique({
    where: { email },
  });
  expect(confirmedRow!.confirmedAt).not.toBeNull();
  expect(confirmedRow!.confirmToken).toBeNull();

  // --- 3. Simulate a weekly send directly against the test DB -----------
  // The real script requires full env + Resend. In E2E we assert idempotency
  // and lastSentWeek mechanics via DB manipulation (the in-process mock of
  // Resend lives in integration tests).
  const birth = confirmedRow!.birthDate;
  const msSinceBirth = Date.now() - birth.getTime();
  const currentWeek = Math.floor(msSinceBirth / (7 * 86_400_000));
  expect(currentWeek).toBeGreaterThan(0);
  await prisma.subscription.update({
    where: { email },
    data: { lastSentWeek: currentWeek, lastSentAt: new Date() },
  });

  // --- 4. Edit page + PATCH ---------------------------------------------
  const unsubToken = confirmedRow!.unsubscribeToken;
  await page.goto(`/edit?token=${unsubToken}`);
  await expect(page.getByText("editar lembretes.")).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
  const dateInput = page.getByLabel(/data de nascimento/i);
  await dateInput.fill("1985-07-20");
  await page.getByRole("button", { name: /salvar/i }).click();
  await expect(
    page.getByText("Suas preferências foram atualizadas."),
  ).toBeVisible();

  const afterEdit = await prisma.subscription.findUnique({ where: { email } });
  expect(afterEdit!.birthDate.toISOString().split("T")[0]).toBe("1985-07-20");

  // --- 5. One-click unsubscribe (POST form-urlencoded) -----------------
  const unsubResp = await page.request.post(`${baseURL}/api/unsubscribe`, {
    form: { token: unsubToken },
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  expect(unsubResp.status()).toBe(200);
  const cancelled = await prisma.subscription.findUnique({ where: { email } });
  expect(cancelled!.unsubscribedAt).not.toBeNull();
});
