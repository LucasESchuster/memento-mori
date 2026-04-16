"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Quote as QuoteType } from "@/lib/quotes";

type Props = {
  quote: QuoteType;
  onRefresh?: () => void;
};

export function Quote({ quote, onRefresh }: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 pt-8">
      <AnimatePresence mode="wait">
        <motion.figure
          key={quote.text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col gap-3"
        >
          <blockquote className="font-serif text-2xl leading-snug italic text-neutral-800">
            &ldquo;{quote.text}&rdquo;
          </blockquote>
          <figcaption className="font-serif text-sm tracking-wide text-neutral-500">
            — {quote.author}
          </figcaption>
        </motion.figure>
      </AnimatePresence>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Nova citação"
          className="group mt-2 inline-flex w-fit items-center gap-1.5 font-serif text-xs tracking-wide text-neutral-400 transition-colors hover:text-neutral-900"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180"
          >
            <path d="M21 12a9 9 0 1 1-3.1-6.8" />
            <path d="M21 4v5h-5" />
          </svg>
          nova citação
        </button>
      )}
    </div>
  );
}
