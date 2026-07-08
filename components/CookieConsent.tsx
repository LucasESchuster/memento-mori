"use client";

import Link from "next/link";
import { useConsent } from "@/components/ConsentProvider";

export function CookieConsent() {
  const { consent, hydrated, grant, deny } = useConsent();

  // Only show once we know there is no stored decision — mirrors the hydration
  // gate used for the letter-invite popup to avoid SSR/CSR mismatch.
  if (!hydrated || consent !== null) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="mm-invite-anim fixed bottom-8 left-8 z-50 w-[360px] max-w-[calc(100vw-64px)] border border-[color:var(--ink)] bg-[color:var(--paper)] p-7 font-serif shadow-lg"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <span className="mm-breathe inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--terracotta)]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[color:var(--terracotta)]">
          Cookies · Privacidade
        </span>
      </div>

      <h3
        className="mb-3 font-serif font-normal text-[color:var(--ink)]"
        style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.015em" }}
      >
        Podemos acompanhar como você{" "}
        <em className="text-[color:var(--terracotta)]">usa</em> o site?
      </h3>
      <p
        className="mb-6 font-serif italic text-[color:var(--ink-soft)]"
        style={{ fontWeight: 300, fontSize: 16, lineHeight: 1.5 }}
      >
        Usamos uma ferramenta de análise para entender o que funciona e melhorar
        sua experiência. Nada de anúncios, nada de venda de dados.{" "}
        <Link
          href="/privacidade"
          className="text-[color:var(--ink-mute)] underline underline-offset-2"
        >
          Saiba mais
        </Link>
        .
      </p>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={grant}
          className="inline-flex w-full items-center justify-center gap-3 border-0 bg-[color:var(--ink)] py-3.5 font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--paper)]"
        >
          <span>Sim, pode</span>
          <span className="text-xs">→</span>
        </button>
        <button
          type="button"
          onClick={deny}
          className="w-full border-0 bg-transparent py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-fade)]"
        >
          agora não
        </button>
      </div>
    </div>
  );
}
