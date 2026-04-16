"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Quote as QuoteType } from "@/lib/quotes";

type Props = {
  quote: QuoteType;
};

export function Quote({ quote }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.figure
        key={quote.text}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col gap-3 border-t border-neutral-200 pt-8"
      >
        <blockquote className="font-serif text-2xl leading-snug italic text-neutral-800">
          &ldquo;{quote.text}&rdquo;
        </blockquote>
        <figcaption className="font-serif text-sm tracking-wide text-neutral-500">
          — {quote.author}
        </figcaption>
      </motion.figure>
    </AnimatePresence>
  );
}
