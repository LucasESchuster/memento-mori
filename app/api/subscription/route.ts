import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()),
  lifeExpectancy: z.number().int().min(60).max(100),
});

function getToken(req: Request): string | null {
  const { searchParams } = new URL(req.url);
  return searchParams.get("token");
}

export async function GET(req: Request) {
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }
  const sub = await prisma.subscription.findUnique({
    where: { unsubscribeToken: token },
    select: {
      email: true,
      birthYear: true,
      lifeExpectancy: true,
      unsubscribedAt: true,
    },
  });
  if (!sub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    email: sub.email,
    birthYear: sub.birthYear,
    lifeExpectancy: sub.lifeExpectancy,
    unsubscribed: sub.unsubscribedAt !== null,
  });
}

export async function PATCH(req: Request) {
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const sub = await prisma.subscription.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!sub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      birthYear: parsed.data.birthYear,
      lifeExpectancy: parsed.data.lifeExpectancy,
    },
  });

  return NextResponse.json({ status: "updated" });
}
