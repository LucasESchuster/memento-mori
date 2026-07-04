"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

type Section = { id: string; label: string };

const SECTIONS: Section[] = [
  { id: "configurar", label: "I · configurar" },
  { id: "restante", label: "II · o que resta" },
  { id: "vida", label: "III · sua vida" },
  { id: "reflexao", label: "IV · meditar" },
  { id: "carta", label: "V · carta semanal" },
];

type Tick = Section & { pct: number };

export function TimeThread() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });
  const topPct = useTransform(smooth, (v) => `${(v * 100).toFixed(2)}%`);
  const [pctText, setPctText] = useState("0%");
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return smooth.on("change", (v) => {
      setProgress(v);
      setPctText(`${Math.round(v * 100)}%`);
    });
  }, [smooth]);

  useEffect(() => {
    const doc = document.documentElement;
    const getMax = () =>
      Math.max(1, (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight);

    const updateTicks = () => {
      const max = getMax();
      const next: Tick[] = [];
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + (window.scrollY || doc.scrollTop || 0);
        next.push({ ...s, pct: Math.min(1, Math.max(0, top / max)) });
      }
      setTicks(next);
    };

    updateTicks();
    const onResize = () => updateTicks();
    window.addEventListener("resize", onResize, { passive: true });
    const timers = [
      window.setTimeout(updateTicks, 120),
      window.setTimeout(updateTicks, 600),
      window.setTimeout(updateTicks, 1600),
    ];
    return () => {
      window.removeEventListener("resize", onResize);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-y-0 left-10 z-40 hidden w-10 flex-col items-center lg:flex">
      <div
        className="py-6 font-mono text-[9px] uppercase tracking-[0.28em] text-[color:var(--ink-mute)]"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        início
      </div>
      <div
        className="relative w-px flex-1"
        style={{
          background:
            "linear-gradient(to bottom, var(--ink) 0%, var(--ink) 90%, var(--terracotta) 100%)",
        }}
      >
        {ticks.map((t) => {
          const isPast = progress >= t.pct - 0.005;
          const top = `${(t.pct * 100).toFixed(2)}%`;
          const labelTop = `calc(${(t.pct * 100).toFixed(2)}% - 5px)`;
          return (
            <div key={t.id}>
              <div
                className="absolute h-px w-[9px]"
                style={{
                  left: "-4px",
                  top,
                  background: isPast ? "var(--terracotta)" : "var(--ink)",
                }}
              />
              <div
                className="absolute whitespace-nowrap font-mono text-[9px] tracking-[0.22em]"
                style={{
                  left: "12px",
                  top: labelTop,
                  color: isPast ? "var(--terracotta)" : "var(--ink-fade)",
                }}
              >
                {t.label}
              </div>
            </div>
          );
        })}
        <motion.div
          className="absolute flex items-center"
          style={{
            left: "-5px",
            top: topPct,
            transform: "translateY(-50%)",
          }}
        >
          <div
            className="h-[11px] w-[11px]"
            style={{ background: "var(--terracotta)", transform: "rotate(45deg)" }}
          />
          <div
            className="absolute whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.28em] text-[color:var(--terracotta)]"
            style={{ left: "22px", top: "50%", transform: "translateY(-50%)" }}
          >
            · {pctText}
          </div>
        </motion.div>
      </div>
      <div
        className="py-6 font-mono text-[9px] uppercase tracking-[0.28em] text-[color:var(--terracotta)]"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        fim
      </div>
    </div>
  );
}
