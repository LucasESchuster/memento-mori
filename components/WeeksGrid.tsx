"use client";

import { motion } from "framer-motion";

type Props = {
  weeksLived: number;
  totalWeeks: number;
};

export function WeeksGrid({ weeksLived, totalWeeks }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs tracking-[0.2em] text-neutral-500 uppercase">
          sua vida em semanas
        </span>
        <span className="font-serif text-sm text-neutral-400">
          {weeksLived} / {totalWeeks}
        </span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        className="grid gap-[2px] grid-cols-[repeat(26,minmax(0,1fr))] sm:grid-cols-[repeat(52,minmax(0,1fr))]"
      >
        {Array.from({ length: totalWeeks }).map((_, i) => (
          <div
            key={i}
            className={
              i < weeksLived
                ? "aspect-square bg-neutral-900"
                : "aspect-square border border-neutral-200"
            }
          />
        ))}
      </motion.div>
      <p className="font-serif text-xs italic text-neutral-400">
        cada quadrado é uma semana da sua vida
      </p>
    </div>
  );
}
