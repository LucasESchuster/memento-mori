"use client";

import { motion, type Variants } from "framer-motion";
import type { LifeStats as LifeStatsType } from "@/lib/calculations";

type Props = {
  stats: LifeStatsType;
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function LifeStats({ stats }: Props) {
  const rows: { label: string; value: string }[] = [
    { label: "Anos vividos", value: formatNumber(stats.yearsLived) },
    { label: "Anos restantes", value: formatNumber(stats.yearsRemaining) },
    { label: "Semanas restantes", value: formatNumber(stats.weeksRemaining) },
    { label: "Dias restantes", value: formatNumber(stats.daysRemaining) },
  ];

  return (
    <motion.dl
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-y-6 gap-x-8"
    >
      {rows.map((row) => (
        <motion.div key={row.label} variants={item} className="flex flex-col">
          <dt className="text-xs tracking-[0.2em] text-neutral-500 uppercase">
            {row.label}
          </dt>
          <dd className="mt-1 font-serif text-3xl font-light text-neutral-900">
            {row.value}
          </dd>
        </motion.div>
      ))}
    </motion.dl>
  );
}
