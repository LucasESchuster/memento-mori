import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { randomToken } from "@/lib/tokens";
import { sendConfirmEmail } from "@/lib/resend";

const schema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
  lifeExpectancy: z.number().int().min(60).max(100),
});

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "too_many_requests" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { email, birthYear, lifeExpectancy } = parsed.data;
  const existing = await prisma.subscription.findUnique({ where: { email } });

  if (existing && existing.confirmedAt && !existing.unsubscribedAt) {
    return NextResponse.json({ status: "already_subscribed" }, { status: 200 });
  }

  const confirmToken = randomToken();
  const unsubscribeToken = existing?.unsubscribeToken ?? randomToken();

  const sub = existing
    ? await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          birthYear,
          lifeExpectancy,
          confirmToken,
          confirmedAt: null,
          unsubscribedAt: null,
          lastSentWeek: 0,
          lastSentAt: null,
        },
      })
    : await prisma.subscription.create({
        data: {
          email,
          birthYear,
          lifeExpectancy,
          confirmToken,
          unsubscribeToken,
        },
      });

  try {
    await sendConfirmEmail({ to: email, confirmToken });
  } catch (err) {
    console.error("[subscribe] sendConfirmEmail failed", err);
    return NextResponse.json(
      { error: "email_send_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { status: "confirmation_sent", id: sub.id },
    { status: existing ? 200 : 201 },
  );
}
