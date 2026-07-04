import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/db";

// Minimal shape of the Resend webhook events we care about.
type ResendEvent = {
  type: string;
  data?: {
    to?: string[] | string;
    bounce?: { type?: string };
  };
};

// Suppress on complaints (spam reports) and hard bounces only. Soft bounces
// are transient (full mailbox, greylisting) and must not disable a subscriber.
export function shouldSuppress(event: ResendEvent): boolean {
  if (event.type === "email.complained") return true;
  if (event.type === "email.bounced") {
    return event.data?.bounce?.type === "hard";
  }
  return false;
}

// `to` may arrive as an array or a single string; normalize to the first
// address, lowercased (emails are stored lowercased — business rule #1).
export function extractEmail(event: ResendEvent): string | null {
  const to = event.data?.to;
  const value = Array.isArray(to) ? to[0] : to;
  return value ? value.toLowerCase() : null;
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhooks/resend] RESEND_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  // Raw body is required — the Svix signature is computed over the exact bytes.
  const payload = await req.text();

  let event: ResendEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    }) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  if (shouldSuppress(event)) {
    const email = extractEmail(event);
    if (email) {
      // updateMany is a safe no-op if the address is unknown; setting bouncedAt
      // again on a retry of the same event is idempotent.
      await prisma.subscription.updateMany({
        where: { email },
        data: { bouncedAt: new Date() },
      });
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
