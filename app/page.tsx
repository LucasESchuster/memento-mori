"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HeaderBar } from "@/components/HeaderBar";
import { TimeThread } from "@/components/TimeThread";
import { HeroSection } from "@/components/HeroSection";
import { ConfigureSection } from "@/components/ConfigureSection";
import { RestSection } from "@/components/RestSection";
import { LifeGridSection, type GridView } from "@/components/LifeGridSection";
import { ReflectionSection } from "@/components/ReflectionSection";
import { SubscribeSection } from "@/components/SubscribeSection";
import { LetterInvitePopup } from "@/components/LetterInvitePopup";
import { FooterBar } from "@/components/FooterBar";
import {
  calculateLifeStats,
  isValidBirthDate,
  parseBirthDate,
} from "@/lib/calculations";
import { pickRandomQuote, quotes, type Quote } from "@/lib/quotes";

const STORAGE_KEY = "memento-mori:inputs";
const DEFAULT_EXPECTANCY = 80;
const MONTH_MS = 30.44 * 86_400_000;

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
  const [view, setView] = useState<GridView>("weeks");
  const [quote, setQuote] = useState<Quote>(quotes[0]);
  const [hydrated, setHydrated] = useState(false);
  const [showLetterInvite, setShowLetterInvite] = useState(false);
  const [inviteDismissed, setInviteDismissed] = useState(false);
  const inviteTimerRef = useRef<number | null>(null);
  const [today, setToday] = useState("");
  const [now, setNow] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect --
     Hydrating browser-only state (localStorage, Date.now) after mount is the
     canonical pattern; a lazy useState initializer runs on the server too,
     which would cause hydration mismatches on return visits. */
  useEffect(() => {
    const stored = readStored();
    if (stored.birthDate) setBirthDate(stored.birthDate);
    if (stored.lifeExpectancy) setLifeExpectancy(stored.lifeExpectancy);
    setQuote(pickRandomQuote());
    setToday(new Date().toISOString().slice(0, 10));
    setNow(Date.now());
    setHydrated(true);
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(tick);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const hasBirth = isValidBirthDate(birthDate);
  const birthTime = useMemo(
    () => (hasBirth ? parseBirthDate(birthDate).getTime() : null),
    [birthDate, hasBirth],
  );

  const stats = useMemo(() => {
    const birth = hasBirth ? parseBirthDate(birthDate) : new Date(0);
    return calculateLifeStats(birth, lifeExpectancy);
  }, [birthDate, lifeExpectancy, hasBirth]);

  const displayStats = hasBirth
    ? stats
    : {
        yearsLived: 0,
        yearsRemaining: lifeExpectancy,
        weeksLived: 0,
        weeksRemaining: lifeExpectancy * 52,
        daysRemaining: Math.round(lifeExpectancy * 365.25),
        percentLived: 0,
        totalWeeks: Math.round(lifeExpectancy * 52),
      };

  const monthsLived = useMemo(() => {
    if (!hasBirth || birthTime === null || now === 0) return 0;
    return Math.max(0, Math.floor((now - birthTime) / MONTH_MS));
  }, [hasBirth, birthTime, now]);

  const monthsRemaining = Math.max(0, Math.round(lifeExpectancy * 12) - monthsLived);

  function persist(next: { birthDate?: string; lifeExpectancy?: number }) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          birthDate: next.birthDate ?? birthDate,
          lifeExpectancy: next.lifeExpectancy ?? lifeExpectancy,
        }),
      );
    } catch {
      // ignore storage errors (private mode, quota)
    }
  }

  function handleBirthDateChange(value: string) {
    const wasValid = isValidBirthDate(birthDate);
    const nowValid = isValidBirthDate(value);
    setBirthDate(value);
    persist({ birthDate: value });

    if (!wasValid && nowValid && !inviteDismissed) {
      if (inviteTimerRef.current) window.clearTimeout(inviteTimerRef.current);
      setShowLetterInvite(false);
      inviteTimerRef.current = window.setTimeout(() => {
        setShowLetterInvite(true);
      }, 1400);
    }
    if (wasValid && !nowValid) {
      if (inviteTimerRef.current) window.clearTimeout(inviteTimerRef.current);
      setShowLetterInvite(false);
    }
  }

  function handleLifeExpectancyChange(value: number) {
    setLifeExpectancy(value);
    persist({ lifeExpectancy: value });
  }

  function dismissInvite() {
    setShowLetterInvite(false);
    setInviteDismissed(true);
    if (inviteTimerRef.current) window.clearTimeout(inviteTimerRef.current);
  }

  function acceptInvite() {
    setShowLetterInvite(false);
    setInviteDismissed(true);
    if (inviteTimerRef.current) window.clearTimeout(inviteTimerRef.current);
    if (typeof document === "undefined") return;
    const el = document.getElementById("carta");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const inp = document.querySelector<HTMLInputElement>(
        '#carta input[type="email"]',
      );
      if (inp) inp.focus();
    }, 700);
  }

  function nextQuote() {
    setQuote((current) => pickRandomQuote(current));
  }

  useEffect(() => {
    return () => {
      if (inviteTimerRef.current) window.clearTimeout(inviteTimerRef.current);
    };
  }, []);

  return (
    <main className="min-h-screen">
      <HeaderBar />
      <TimeThread />
      <HeroSection hasBirth={hasBirth} birthTime={birthTime} />
      <ConfigureSection
        birthDate={birthDate}
        lifeExpectancy={lifeExpectancy}
        onBirthDateChange={handleBirthDateChange}
        onLifeExpectancyChange={handleLifeExpectancyChange}
        today={today}
      />
      <RestSection
        hasBirth={hasBirth}
        stats={displayStats}
        lifeExpectancy={lifeExpectancy}
        monthsRemaining={monthsRemaining}
      />
      <LifeGridSection
        view={view}
        onViewChange={setView}
        hasBirth={hasBirth}
        birthTime={birthTime}
        lifeExpectancy={lifeExpectancy}
        yearsLived={displayStats.yearsLived}
        weeksLived={displayStats.weeksLived}
        monthsLived={monthsLived}
      />
      <ReflectionSection quote={quote} onNext={nextQuote} />
      <SubscribeSection
        birthDate={birthDate}
        lifeExpectancy={lifeExpectancy}
        canSubmit={hasBirth}
      />
      <FooterBar />
      {hydrated && showLetterInvite && (
        <LetterInvitePopup onAccept={acceptInvite} onDismiss={dismissInvite} />
      )}
    </main>
  );
}
