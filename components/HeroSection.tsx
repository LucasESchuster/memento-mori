"use client";

import { useEffect, useState } from "react";

type Props = {
  hasBirth: boolean;
  birthTime: number | null;
};

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

export function HeroSection({ hasBirth, birthTime }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const livedMs = hasBirth && birthTime !== null ? Math.max(0, now - birthTime) : 0;
  const seconds = Math.floor(livedMs / 1000);
  const dy = Math.floor(seconds / 86400);
  const hr = Math.floor(seconds / 3600) % 24;
  const min = Math.floor(seconds / 60) % 60;
  const sec = seconds % 60;

  const dash = (v: string) => (hasBirth ? v : "—");

  return (
    <section className="relative mx-auto max-w-[1240px] px-6 pt-8 pb-24 md:px-12 md:pt-16 md:pb-32">
     
      <h1
        className="mb-6 font-serif font-normal text-[color:var(--ink)]"
        style={{
          fontSize: "clamp(88px, 12vw, 200px)",
          lineHeight: 0.92,
          letterSpacing: "-0.04em",
        }}
      >
        Memento
        <br />
        <em
          className="font-light text-[color:var(--ink-soft)]"
          style={{ fontWeight: 300 }}
        >
          mori.
        </em>
      </h1>
      <p
        className="mb-16 max-w-[680px] font-serif italic text-[color:var(--ink-soft)] md:mb-20"
        style={{ fontWeight: 300, fontSize: "clamp(20px, 2.2vw, 28px)", lineHeight: 1.5 }}
      >
        Lembra-te de que és mortal. Cada semana que passa é um bem que não retorna. Este é
        um espelho: mede-te por ele.
      </p>

      <div className="grid gap-10 border-t border-[color:var(--ink)] pt-7 md:grid-cols-[220px_1fr] md:items-end md:gap-14">
        <div className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.24em] text-[color:var(--ink-mute)]">
          {hasBirth ? "Você está vivo há" : "Aguardando início"}
          <br />
          <span className="text-[color:var(--terracotta)]">
            {hasBirth ? "tempo decorrido, em tempo real" : "→ configure a data abaixo"}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-6 font-serif md:gap-12">
          <div>
            <div
              className="text-[color:var(--ink)]"
              style={{
                fontSize: "clamp(56px, 7vw, 88px)",
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {dash(fmt(dy))}
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-mute)]">
              dias
            </div>
          </div>
          <div className="text-4xl text-[color:var(--cream-strong)]">·</div>
          <div>
            <div
              className="text-[color:var(--ink-soft)]"
              style={{
                fontSize: "clamp(44px, 5.5vw, 72px)",
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              {dash(pad(hr))}
              <span className="text-[color:var(--cream-strong)]">h</span>
            </div>
          </div>
          <div>
            <div
              className="text-[color:var(--ink-soft)]"
              style={{
                fontSize: "clamp(44px, 5.5vw, 72px)",
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              {dash(pad(min))}
              <span className="text-[color:var(--cream-strong)]">m</span>
            </div>
          </div>
          <div>
            <div
              className="text-[color:var(--terracotta)]"
              style={{
                fontSize: "clamp(44px, 5.5vw, 72px)",
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              {dash(pad(sec))}
              <span className="text-[color:var(--cream-strong)]">s</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
