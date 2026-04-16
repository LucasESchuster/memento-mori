"use client";

import { motion } from "framer-motion";

type Props = {
  percentLived: number;
};

export function LifeBar({ percentLived }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between font-serif">
        <span className="text-sm tracking-wide text-neutral-500">vivido</span>
        <span className="text-xl text-neutral-900">
          {percentLived.toFixed(1)}%
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden bg-neutral-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentLived)}
      >
        <motion.div
          key={percentLived}
          initial={{ width: 0 }}
          animate={{ width: `${percentLived}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full bg-neutral-900"
        />
      </div>
    </div>
  );
}
