import { prisma } from "@/lib/db";

function page(message: string, subtitle: string): Response {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Memento Mori</title>
  <style>
    body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#fff; color:#111; }
    main { max-width: 600px; margin: 0 auto; padding: 96px 24px; }
    h1 { font-family: ui-serif, Georgia, 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; letter-spacing: -0.02em; margin: 0 0 8px; }
    p.sub { font-family: ui-serif, Georgia, 'Cormorant Garamond', serif; font-style: italic; color: #6b7280; margin: 0 0 48px; }
    p.message { font-size: 17px; line-height: 28px; border-top: 1px solid #e5e7eb; padding-top: 24px; }
    a { color: #111; text-decoration: underline; }
  </style>
</head>
<body>
  <main>
    <h1>Memento Mori</h1>
    <p class="sub">${subtitle}</p>
    <p class="message">${message}</p>
    <p><a href="/">Voltar ao início</a></p>
  </main>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function handleUnsubscribe(token: string | null): Promise<Response> {
  if (!token) {
    return page(
      "Token inválido ou ausente.",
      "algo saiu errado.",
    );
  }
  const sub = await prisma.subscription.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!sub) {
    return page(
      "Link de cancelamento inválido.",
      "algo saiu errado.",
    );
  }
  if (!sub.unsubscribedAt) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { unsubscribedAt: new Date() },
    });
  }
  return page(
    "Você não receberá mais lembretes. Memento vivere — lembre-se também de viver.",
    "inscrição cancelada.",
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return handleUnsubscribe(searchParams.get("token"));
}

export async function POST(req: Request) {
  let token: string | null = null;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    const value = form.get("token");
    token = typeof value === "string" ? value : null;
  } else {
    const { searchParams } = new URL(req.url);
    token = searchParams.get("token");
  }
  return handleUnsubscribe(token);
}
