import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  birthDate: z.string().date(),
  lifeExpectancy: z.number().int().min(40).max(110),
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
      birthDate: true,
      lifeExpectancy: true,
      unsubscribedAt: true,
    },
  });
  if (!sub) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    email: sub.email,
    birthDate: sub.birthDate.toISOString().split("T")[0],
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
      birthDate: new Date(parsed.data.birthDate + "T00:00:00"),
      lifeExpectancy: parsed.data.lifeExpectancy,
    },
  });

  return NextResponse.json({ status: "updated" });
}

// LGPD right to erasure (art. 18, VI): hard-deletes the row and all its PII.
// Authorized by possession of the unsubscribeToken, same as GET/PATCH.
export async function DELETE(req: Request) {
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  try {
    await prisma.subscription.delete({
      where: { unsubscribeToken: token },
    });
  } catch (err) {
    // P2025 = record to delete does not exist (token already used / invalid).
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json({ status: "deleted" });
}
