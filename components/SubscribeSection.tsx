"use client";

import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

type Props = {
  birthDate: string;
  lifeExpectancy: number;
  canSubmit: boolean;
};

type Status = "idle" | "sending" | "sent" | "error";

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function SubscribeSection({ birthDate, lifeExpectancy, canSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Cleared on expiry or widget error — the token is single-use and stale
  // tokens must not be submitted.
  const clearCaptcha = () => setCaptchaToken(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending" || !canSubmit) return;
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          birthDate,
          lifeExpectancy,
          turnstileToken: captchaToken,
          consent,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { status?: string; error?: string }
        | null;
      if (!res.ok) {
        // Turnstile tokens are single-use — rearm the widget for a retry.
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        setStatus("error");
        setMessage(
          data?.error === "too_many_requests"
            ? "Muitas tentativas. Tente novamente em uma hora."
            : data?.error === "captcha_failed"
              ? "Falha na verificação anti-robô. Tente novamente."
              : data?.error === "invalid_input"
                ? "Dados inválidos. Verifique o email."
                : "Não foi possível inscrever. Tente novamente em instantes.",
        );
        return;
      }
      if (data?.status === "already_subscribed") {
        setStatus("sent");
        setMessage(
          "Este email já está inscrito e ativo. Você continua recebendo os lembretes.",
        );
        return;
      }
      setStatus("sent");
      setMessage(
        `Enviamos um email de confirmação para ${email}. Abra-o para ativar a inscrição.`,
      );
    } catch {
      setStatus("error");
      setMessage("Erro de rede. Tente novamente.");
    }
  }

  const label =
    status === "sending"
      ? "Enviando…"
      : status === "sent"
        ? "inscrito · até a próxima semana da sua vida"
        : "receber lembretes semanais";

  return (
    <section
      id="carta"
      className="mx-auto max-w-[1240px] px-6 py-24 md:px-12 md:py-36"
    >
      <div className="grid gap-12 md:grid-cols-2 md:items-start md:gap-24">
        <div>
          <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--terracotta)]">
            V. Lembrete semanal
          </div>
          <h2
            className="mb-6 font-serif font-normal text-[color:var(--ink)]"
            style={{ fontSize: "clamp(40px, 5.5vw, 64px)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
          >
            Uma <em className="text-[color:var(--terracotta)]">carta</em> a cada semana
            que passa.
          </h2>
          <p
            className="font-serif italic text-[color:var(--ink-soft)]"
            style={{ fontWeight: 300, fontSize: 22, lineHeight: 1.5 }}
          >
            A cada semana que você completa de vida, um breve email: quantas semanas
            vividas, quantas restam, e uma meditação. Até o fim dos seus dias.
          </p>
        </div>

        {status === "sent" ? (
          <div className="pt-5">
            <p className="font-serif text-lg italic text-[color:var(--ink)]">
              {message}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-5">
            <div className="mb-5">
              <label
                htmlFor="subscribe-email"
                className="mb-3 block font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-mute)]"
              >
                Seu email
              </label>
              <input
                id="subscribe-email"
                type="email"
                required
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "sending"}
                className="w-full border-0 border-b border-[color:var(--ink)] bg-transparent px-0 py-3 font-serif text-[28px] text-[color:var(--ink)] outline-none placeholder:text-[color:var(--ink-fade)]"
              />
            </div>
            {turnstileSiteKey && (
              <div className="mb-5">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  options={{
                    theme: "light",
                    language: "pt-BR",
                    size: "flexible",
                  }}
                  onSuccess={setCaptchaToken}
                  onExpire={clearCaptcha}
                  onError={clearCaptcha}
                />
              </div>
            )}
            <label
              htmlFor="subscribe-consent"
              className="mb-5 flex cursor-pointer items-start gap-3 font-sans text-[13px] leading-relaxed text-[color:var(--ink-soft)]"
            >
              <input
                id="subscribe-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={status === "sending"}
                className="mt-1 h-4 w-4 shrink-0 accent-[color:var(--ink)]"
              />
              <span>
                Li e concordo com a{" "}
                <a
                  href="/privacidade"
                  className="border-b border-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--ink)]"
                >
                  Política de Privacidade
                </a>{" "}
                e em receber os lembretes por email.
              </span>
            </label>
            <button
              type="submit"
              disabled={
                status === "sending" ||
                !email ||
                !consent ||
                !canSubmit ||
                (!!turnstileSiteKey && !captchaToken)
              }
              className="w-full bg-[color:var(--ink)] px-6 py-5 font-mono text-[11px] uppercase tracking-[0.28em] text-[color:var(--paper)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {label} →
            </button>
            <div className="mt-5 flex justify-between font-mono text-[10px] tracking-[0.16em] text-[color:var(--ink-fade)]">
              <span>◦ cancele quando quiser</span>
              <span>◦ zero spam · um email por semana</span>
            </div>
            {status === "error" && message && (
              <p className="mt-4 font-serif text-sm italic text-[color:var(--ink-soft)]">
                {message}
              </p>
            )}
            {!canSubmit && (
              <p className="mt-4 font-serif text-sm italic text-[color:var(--ink-fade)]">
                Preencha uma data de nascimento válida acima para poder se inscrever.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
