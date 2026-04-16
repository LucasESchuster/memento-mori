import { Resend } from "resend";
import { render } from "@react-email/components";
import { ConfirmEmail } from "@/emails/ConfirmEmail";
import { WeeklyEmail } from "@/emails/WeeklyEmail";
import type { LifeStats } from "@/lib/calculations";
import type { Quote } from "@/lib/quotes";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;
const appUrl = process.env.APP_URL;

function requireEnv(): { apiKey: string; from: string; appUrl: string } {
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  if (!from) throw new Error("EMAIL_FROM is not set");
  if (!appUrl) throw new Error("APP_URL is not set");
  return { apiKey, from, appUrl };
}

let cachedClient: Resend | null = null;
function client(): Resend {
  if (!cachedClient) {
    const { apiKey: key } = requireEnv();
    cachedClient = new Resend(key);
  }
  return cachedClient;
}

export async function sendConfirmEmail(params: {
  to: string;
  confirmToken: string;
}): Promise<void> {
  const env = requireEnv();
  const confirmUrl = `${env.appUrl}/api/confirm?token=${params.confirmToken}`;
  const react = ConfirmEmail({ confirmUrl });
  const html = await render(react);
  const text = await render(react, { plainText: true });

  await client().emails.send({
    from: env.from,
    to: params.to,
    subject: "Confirme sua inscrição — Memento Mori",
    html,
    text,
  });
}

export async function sendWeeklyEmail(params: {
  to: string;
  currentWeek: number;
  totalWeeks: number;
  stats: LifeStats;
  quote: Quote;
  unsubscribeToken: string;
}): Promise<void> {
  const env = requireEnv();
  const unsubscribeUrl = `${env.appUrl}/api/unsubscribe?token=${params.unsubscribeToken}`;
  const editUrl = `${env.appUrl}/edit?token=${params.unsubscribeToken}`;
  const react = WeeklyEmail({
    currentWeek: params.currentWeek,
    totalWeeks: params.totalWeeks,
    stats: params.stats,
    quote: params.quote,
    appUrl: env.appUrl,
    unsubscribeUrl,
    editUrl,
  });
  const html = await render(react);
  const text = await render(react, { plainText: true });

  await client().emails.send({
    from: env.from,
    to: params.to,
    subject: `Semana ${params.currentWeek.toLocaleString("pt-BR")} — memento mori.`,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}
