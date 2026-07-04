"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

export type GridView = "weeks" | "months" | "years";

type Props = {
  view: GridView;
  onViewChange: (view: GridView) => void;
  hasBirth: boolean;
  birthTime: number | null;
  lifeExpectancy: number;
  yearsLived: number;
  weeksLived: number;
  monthsLived: number;
};

const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

const YEAR_MS = 365.25 * 86_400_000;
const WEEK_MS = 7 * 86_400_000;
const MONTH_MS = 30.44 * 86_400_000;

const MILESTONES: { age: number; label: string }[] = [
  { age: 7, label: "infância" },
  { age: 18, label: "maioridade" },
  { age: 25, label: "quarto de vida" },
  { age: 40, label: "meio da meia-idade" },
  { age: 65, label: "reforma provável" },
  { age: 80, label: "octogenário" },
];

export function LifeGridSection({
  view,
  onViewChange,
  hasBirth,
  birthTime,
  lifeExpectancy,
  yearsLived,
  weeksLived,
  monthsLived,
}: Props) {
  const viewLabel = view === "weeks" ? "semanas" : view === "months" ? "meses" : "anos";

  const { cols, cellSize, gap, totalUnits, livedUnits } = useMemo(() => {
    if (view === "weeks") {
      return {
        cols: 52,
        cellSize: 11,
        gap: 2,
        totalUnits: lifeExpectancy * 52,
        livedUnits: Math.min(weeksLived, lifeExpectancy * 52),
      };
    }
    if (view === "months") {
      return {
        cols: 12,
        cellSize: 32,
        gap: 3,
        totalUnits: lifeExpectancy * 12,
        livedUnits: Math.min(monthsLived, lifeExpectancy * 12),
      };
    }
    return {
      cols: 10,
      cellSize: 44,
      gap: 3,
      totalUnits: lifeExpectancy,
      livedUnits: Math.min(yearsLived, lifeExpectancy),
    };
  }, [view, lifeExpectancy, weeksLived, monthsLived, yearsLived]);

  const decades = useMemo(() => {
    const decadeCount = Math.ceil(lifeExpectancy / 10);
    const decadeHeight = 10 * (cellSize + gap);
    const out: { label: string; color: string; height: number }[] = [];
    for (let d = 0; d < decadeCount; d++) {
      const startAge = d * 10;
      const isLived = yearsLived >= startAge + 10;
      const isCurrent = yearsLived >= startAge && yearsLived < startAge + 10;
      const color = isCurrent
        ? "var(--terracotta)"
        : isLived
          ? "var(--ink)"
          : "#a89e88";
      out.push({ label: `${startAge}s`, color, height: decadeHeight });
    }
    return out;
  }, [lifeExpectancy, cellSize, gap, yearsLived]);

  const milestones = MILESTONES.map((m) => ({
    ...m,
    color: yearsLived >= m.age ? "var(--ink)" : "var(--ink-fade)",
  }));

  const cells = useMemo(() => {
    const arr: {
      key: number;
      title: string;
      isLived: boolean;
      isCurrent: boolean;
    }[] = [];
    const birth = birthTime ?? 0;
    for (let i = 0; i < totalUnits; i++) {
      const isCurrent = hasBirth && i === livedUnits;
      const isLived = i < livedUnits;
      let title = "";
      if (hasBirth) {
        if (view === "weeks") {
          const d = new Date(birth + i * WEEK_MS);
          title = `Semana ${i + 1} · ${d.toLocaleDateString("pt-BR")} · ${Math.floor(
            (i * WEEK_MS) / YEAR_MS,
          )} anos`;
        } else if (view === "months") {
          const d = new Date(birth + i * MONTH_MS);
          title = `Mês ${i + 1} · ${d.toLocaleDateString("pt-BR")} · ${Math.floor(
            (i * MONTH_MS) / YEAR_MS,
          )} anos`;
        } else {
          title = `Ano ${i + 1} · aos ${i} anos`;
        }
      } else {
        title = `${viewLabel.slice(0, -1)} ${i + 1}`;
      }
      arr.push({ key: i, title, isLived, isCurrent });
    }
    return arr;
  }, [totalUnits, livedUnits, view, hasBirth, birthTime, viewLabel]);

  const remainCells = Math.max(0, totalUnits - livedUnits);
  const decadeCount = decades.length;

  const btn = (active: boolean) =>
    `px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.24em] transition-colors ${
      active ? "bg-[color:var(--ink)] text-[color:var(--paper)]" : "bg-transparent text-[color:var(--ink-mute)]"
    }`;

  return (
    <section
      id="vida"
      className="mx-auto max-w-[1240px] px-6 py-24 md:px-12 md:py-36"
    >
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end">
        <div>
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--terracotta)]">
            III. Toda a tua vida numa página
          </div>
          <h2
            className="mb-5 font-serif font-normal text-[color:var(--ink)]"
            style={{ fontSize: "clamp(44px, 6vw, 72px)", lineHeight: 1, letterSpacing: "-0.03em" }}
          >
            Sua vida em <em className="text-[color:var(--terracotta)]">{viewLabel}</em>.
          </h2>
          <p
            className="max-w-[560px] font-serif italic text-[color:var(--ink-mute)]"
            style={{ fontWeight: 300, fontSize: 20, lineHeight: 1.5 }}
          >
            Cada quadrado é um instante que já foi ou virá a ser. Passe o mouse para ver a
            data.
          </p>
        </div>
        <div className="flex gap-1 border border-[color:var(--rule)] bg-[color:var(--cream)] p-1">
          <button
            type="button"
            className={btn(view === "weeks")}
            onClick={() => onViewChange("weeks")}
          >
            semanas
          </button>
          <button
            type="button"
            className={btn(view === "months")}
            onClick={() => onViewChange("months")}
          >
            meses
          </button>
          <button
            type="button"
            className={btn(view === "years")}
            onClick={() => onViewChange("years")}
          >
            anos
          </button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[60px_1fr_200px]">
        <div
          className="hidden pt-1 font-mono text-[10px] tracking-[0.16em] lg:flex lg:flex-col"
          aria-hidden
        >
          {decades.map((d, idx) => (
            <div
              key={idx}
              className="flex items-start pt-0.5"
              style={{
                height: `${d.height}px`,
                borderTop: `1px solid ${d.color}`,
                color: d.color,
              }}
            >
              {d.label}
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="overflow-x-auto"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gap: `${gap}px`,
              justifyContent: "start",
            }}
          >
            {cells.map((c) => (
              <div
                key={c.key}
                title={c.title}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  background: c.isCurrent
                    ? "var(--sun)"
                    : c.isLived
                      ? "var(--ink)"
                      : "transparent",
                  border: c.isCurrent || c.isLived ? "0" : "1px solid var(--cream-strong)",
                }}
              />
            ))}
          </div>
        </motion.div>

        <div className="font-mono text-[10px] leading-relaxed tracking-[0.16em] text-[color:var(--ink-mute)]">
          <div className="mb-4 uppercase tracking-[0.24em] text-[color:var(--ink)]">
            Legenda
          </div>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="inline-block h-2.5 w-2.5 bg-[color:var(--ink)]" />
            <span>vivido · {hasBirth ? fmt(livedUnits) : "—"}</span>
          </div>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="inline-block h-2.5 w-2.5 bg-[color:var(--sun)]" />
            <span>este momento</span>
          </div>
          <div className="mb-6 flex items-center gap-2.5">
            <span className="inline-block h-2.5 w-2.5 border border-[color:var(--cream-strong)] bg-transparent" />
            <span>por vir · {fmt(remainCells)}</span>
          </div>

          <div className="mt-8 mb-4 uppercase tracking-[0.24em] text-[color:var(--ink)]">
            Marcos
          </div>
          <div className="font-serif text-base tracking-normal">
            {milestones.map((m) => (
              <div
                key={m.age}
                className="grid grid-cols-[40px_1fr] border-t border-[color:var(--rule)] py-2"
              >
                <span className="pt-0.5 font-mono text-[10px] tracking-[0.14em] text-[color:var(--terracotta)]">
                  {m.age}
                </span>
                <span className="italic" style={{ color: m.color }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-between border-t border-[color:var(--rule)] pt-6 font-mono text-[11px] tracking-[0.18em] text-[color:var(--ink-mute)]">
        <span>
          {hasBirth ? fmt(livedUnits) : "—"} / {fmt(totalUnits)} {viewLabel}
        </span>
        <span>
          uma vida = {fmt(totalUnits)} {viewLabel}
          {decadeCount > 0 ? "" : ""}
        </span>
      </div>
    </section>
  );
}
