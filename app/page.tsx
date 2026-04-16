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
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
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
          <Quote quote={quote} />
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
