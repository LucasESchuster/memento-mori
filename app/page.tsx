"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LifeForm } from "@/components/LifeForm";
import { LifeStats } from "@/components/LifeStats";
import { LifeBar } from "@/components/LifeBar";
import { WeeksGrid } from "@/components/WeeksGrid";
import { Quote } from "@/components/Quote";
import { SubscribeForm } from "@/components/SubscribeForm";
import {
  calculateLifeStats,
  isValidBirthDate,
  parseBirthDate,
  type LifeStats as LifeStatsType,
} from "@/lib/calculations";
import { pickRandomQuote, type Quote as QuoteType } from "@/lib/quotes";

const STORAGE_KEY = "memento-mori:inputs";
const DEFAULT_EXPECTANCY = 80;

type StoredInputs = {
  birthDate?: string;
  lifeExpectancy?: number;
};

function readStored(): StoredInputs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      birthDate: typeof parsed.birthDate === "string" ? parsed.birthDate : undefined,
      lifeExpectancy:
        typeof parsed.lifeExpectancy === "number" ? parsed.lifeExpectancy : undefined,
    };
  } catch {
    return {};
  }
}

export default function Home() {
  const [birthDate, setBirthDate] = useState("");
  const [lifeExpectancy, setLifeExpectancy] = useState(DEFAULT_EXPECTANCY);
  const [result, setResult] = useState<LifeStatsType | null>(null);
  const [quote, setQuote] = useState<QuoteType | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect --
     Hydrating browser-only state from localStorage after mount is the
     canonical pattern; a lazy useState initializer runs on the server too,
     which would cause hydration mismatches on return visits. */
  useEffect(() => {
    const stored = readStored();
    const nextDate = stored.birthDate ?? "";
    const nextExpectancy = stored.lifeExpectancy ?? DEFAULT_EXPECTANCY;
    setBirthDate(nextDate);
    setLifeExpectancy(nextExpectancy);
    if (nextDate && isValidBirthDate(nextDate)) {
      setResult(calculateLifeStats(parseBirthDate(nextDate), nextExpectancy));
      setQuote(pickRandomQuote());
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSubmit() {
    if (!isValidBirthDate(birthDate)) return;
    const stats = calculateLifeStats(parseBirthDate(birthDate), lifeExpectancy);
    setResult(stats);
    setQuote((current) => pickRandomQuote(current ?? undefined));
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ birthDate, lifeExpectancy }),
      );
    } catch {
      // ignore storage errors (e.g. private mode, quota)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[600px] flex-col gap-16 px-6 py-16 md:py-24">
      <motion.aside
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="font-serif text-sm tracking-wide text-neutral-500">
          por{" "}
          <a
            href="https://lucaseduardoschuster.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-neutral-900 underline decoration-neutral-300 decoration-1 underline-offset-4 transition-colors hover:decoration-neutral-900"
          >
            Lucas Eduardo Schuster
          </a>
        </p>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/LucasESchuster/memento-mori"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="currentColor"
            >
              <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.17 0 0 1.01-.32 3.31 1.23a11.48 11.48 0 0 1 6.02 0c2.3-1.55 3.31-1.23 3.31-1.23.65 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 12 .5Z" />
            </svg>
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/lucas-eduardo-schuster-945535231/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="currentColor"
            >
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z" />
            </svg>
            LinkedIn
          </a>
        </div>
      </motion.aside>

      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="flex flex-col gap-3"
      >
        <h1 className="font-serif text-5xl font-light tracking-tight text-neutral-900 md:text-6xl">
          Memento Mori
        </h1>
        <p className="font-serif text-lg italic text-neutral-500">
          Lembre-se de que vais morrer.
        </p>
      </motion.header>

      <section>
        <LifeForm
          birthDate={birthDate}
          lifeExpectancy={lifeExpectancy}
          onBirthDateChange={setBirthDate}
          onLifeExpectancyChange={setLifeExpectancy}
          onSubmit={handleSubmit}
        />
      </section>

      {hydrated && result && quote && (
        <motion.section
          key={`${result.yearsLived}-${result.totalWeeks}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col gap-12"
        >
          <LifeStats stats={result} />
          <LifeBar percentLived={result.percentLived} />
          <WeeksGrid
            weeksLived={result.weeksLived}
            totalWeeks={result.totalWeeks}
          />
          <Quote
            quote={quote}
            onRefresh={() =>
              setQuote((current) => pickRandomQuote(current ?? undefined))
            }
          />
          <SubscribeForm
            birthDate={birthDate}
            lifeExpectancy={lifeExpectancy}
          />
        </motion.section>
      )}

      <footer className="mt-auto border-t border-neutral-200 pt-6 font-serif text-xs tracking-wide text-neutral-400">
        tempus fugit, memento mori.
      </footer>
    </main>
  );
}
