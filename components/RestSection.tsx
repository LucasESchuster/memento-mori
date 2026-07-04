"use client";

import { motion } from "framer-motion";
import type { LifeStats } from "@/lib/calculations";

type Props = {
  hasBirth: boolean;
  stats: LifeStats;
  lifeExpectancy: number;
  monthsRemaining: number;
};

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

export function RestSection({ hasBirth, stats, lifeExpectancy, monthsRemaining }: Props) {
  const dash = (v: string) => (hasBirth ? v : "—");
  const percentText = hasBirth ? `${stats.percentLived.toFixed(2)}%` : "—";
  const width = hasBirth ? `${stats.percentLived.toFixed(2)}%` : "0%";

  const lead = hasBirth
    ? "Se a média não te falhar, restam-te aproximadamente"
    : "Diga-nos quando começou. Enquanto isso, restam-te";

  return (
    <section
      id="restante"
      className="bg-[color:var(--ink)] py-24 text-[color:var(--paper)] md:py-36"
    >
      <div className="mx-auto max-w-[1240px] px-6 md:px-12">
        <div className="mb-8 font-mono text-[11px] uppercase tracking-[0.28em] text-[color:var(--sun)]">
          II. O que resta
        </div>

        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end md:gap-16">
          <div>
            <p
              className="mb-6 max-w-[600px] font-serif italic text-[color:#a09689]"
              style={{ fontWeight: 300, fontSize: "clamp(22px, 2.5vw, 32px)", lineHeight: 1.3 }}
            >
              {lead}
            </p>
            <div className="flex flex-wrap items-baseline gap-6 md:gap-8">
              <span
                className="font-serif text-[color:var(--paper)]"
                style={{
                  fontSize: "clamp(160px, 22vw, 320px)",
                  fontWeight: 400,
                  lineHeight: 0.85,
                  letterSpacing: "-0.05em",
                }}
              >
                {dash(fmt(stats.yearsRemaining))}
              </span>
              <div>
                <div
                  className="font-serif italic text-[color:var(--sun)]"
                  style={{ fontSize: "clamp(40px, 5vw, 56px)", lineHeight: 1 }}
                >
                  anos
                </div>
                <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[color:var(--ink-mute)]">
                  de vida provável
                </div>
              </div>
            </div>
          </div>

          <div
            className="max-w-[280px] text-right font-serif italic text-[color:#a09689]"
            style={{ fontSize: 20, lineHeight: 1.5 }}
          >
            &ldquo;Não é que tenhas pouco tempo; é que perdes muito.&rdquo;
            <div className="mt-3 font-mono text-[10px] not-italic uppercase tracking-[0.24em] text-[color:var(--ink-mute)]">
              Sêneca
            </div>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-2 gap-8 border-t border-[#3a332c] pt-10 md:grid-cols-4 md:gap-10">
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:#a09689]">
              Anos vividos
            </div>
            <div
              className="font-serif text-[color:var(--paper)]"
              style={{ fontSize: "clamp(40px, 4.5vw, 56px)", fontWeight: 400, lineHeight: 1 }}
            >
              {dash(fmt(stats.yearsLived))}
            </div>
          </div>
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:#a09689]">
              Meses restantes
            </div>
            <div
              className="font-serif text-[color:var(--paper)]"
              style={{ fontSize: "clamp(40px, 4.5vw, 56px)", fontWeight: 400, lineHeight: 1 }}
            >
              {dash(fmt(monthsRemaining))}
            </div>
          </div>
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:#a09689]">
              Semanas restantes
            </div>
            <div
              className="font-serif text-[color:var(--paper)]"
              style={{ fontSize: "clamp(40px, 4.5vw, 56px)", fontWeight: 400, lineHeight: 1 }}
            >
              {dash(fmt(stats.weeksRemaining))}
            </div>
          </div>
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:#a09689]">
              Dias restantes
            </div>
            <div
              className="font-serif text-[color:var(--sun)]"
              style={{ fontSize: "clamp(40px, 4.5vw, 56px)", fontWeight: 400, lineHeight: 1 }}
            >
              {dash(fmt(stats.daysRemaining))}
            </div>
          </div>
        </div>

        <div className="mt-14">
          <div className="mb-4 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.24em]">
            <span className="text-[color:#a09689]">Progresso da vida</span>
            <span
              className="font-serif italic text-[color:var(--paper)]"
              style={{ fontSize: 40, fontWeight: 400, letterSpacing: 0 }}
            >
              {percentText}
            </span>
          </div>
          <div
            className="relative h-[2px] overflow-hidden bg-[#3a332c]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(stats.percentLived)}
          >
            <motion.div
              key={stats.percentLived}
              initial={{ width: 0 }}
              animate={{ width }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-[color:var(--sun)]"
            />
          </div>
          <div className="mt-3 flex justify-between font-mono text-[9px] tracking-[0.24em] text-[color:var(--ink-mute)]">
            <span>0 · nascimento</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>{lifeExpectancy} · fim provável</span>
          </div>
        </div>
      </div>
    </section>
  );
}
