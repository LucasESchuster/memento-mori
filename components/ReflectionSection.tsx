"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Quote } from "@/lib/quotes";

type Props = {
  quote: Quote;
  onNext: () => void;
};

export function ReflectionSection({ quote, onNext }: Props) {
  return (
    <section
      id="reflexao"
      className="relative overflow-hidden border-y border-[color:var(--rule)] bg-[color:var(--cream)] py-40 md:py-56"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 select-none font-serif italic text-[color:var(--rule)]"
        style={{
          fontSize: "clamp(320px, 45vw, 720px)",
          lineHeight: 0.7,
          fontWeight: 300,
          opacity: 0.6,
        }}
      >
        ”
      </div>

      <div className="relative mx-auto max-w-[1240px] px-6 md:px-12">
        <div className="mb-16 flex items-center justify-center gap-5">
          <span className="h-px w-14 bg-[color:var(--terracotta)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.36em] text-[color:var(--terracotta)]">
            IV · Meditação
          </span>
          <span className="h-px w-14 bg-[color:var(--terracotta)]" />
        </div>

        <blockquote className="relative mx-auto max-w-[1080px] text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={quote.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-16 font-serif italic text-[color:var(--ink)]"
              style={{
                fontWeight: 300,
                fontSize: "clamp(40px, 6.5vw, 84px)",
                lineHeight: 1.1,
                letterSpacing: "-0.015em",
                textWrap: "balance",
              }}
            >
              {quote.text}
            </motion.p>
          </AnimatePresence>

          <footer className="flex flex-col items-center gap-10">
            <div className="flex items-center gap-5">
              <span className="h-px w-10 bg-[color:var(--ink)]" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={quote.author}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="font-serif tracking-wide text-[color:var(--ink)]"
                  style={{ fontSize: 26, letterSpacing: "0.02em" }}
                >
                  {quote.author}
                </motion.span>
              </AnimatePresence>
              <span className="h-px w-10 bg-[color:var(--ink)]" />
            </div>

            <button
              type="button"
              onClick={onNext}
              className="group inline-flex items-center gap-3.5 border-b border-[color:var(--ink)] py-3 font-mono text-[11px] uppercase tracking-[0.28em] text-[color:var(--ink)]"
            >
              <span className="inline-block text-xs transition-transform duration-500 group-hover:-rotate-180">
                ↻
              </span>
              <span>Nova meditação</span>
            </button>

            <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-fade)]">
              respire · leia devagar · releia
            </div>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
