"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "memento-mori:consent";

export type Consent = "granted" | "denied";

type ConsentContextValue = {
  /** null = no decision made yet. */
  consent: Consent | null;
  /** false until the stored decision has been read from localStorage. */
  hydrated: boolean;
  grant: () => void;
  deny: () => void;
  /** Clears the stored decision so the banner is shown again (revocation). */
  reset: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readStored(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "granted" || raw === "denied" ? raw : null;
  } catch {
    return null;
  }
}

function persist(value: Consent | null) {
  try {
    if (value === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    // ignore storage errors (private mode, quota)
  }
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect --
     Hydrating browser-only state (localStorage) after mount is the canonical
     pattern; a lazy useState initializer runs on the server too, which would
     cause hydration mismatches on return visits. */
  useEffect(() => {
    setConsent(readStored());
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function grant() {
    setConsent("granted");
    persist("granted");
  }

  function deny() {
    setConsent("denied");
    persist("denied");
  }

  function reset() {
    setConsent(null);
    persist(null);
  }

  return (
    <ConsentContext.Provider value={{ consent, hydrated, grant, deny, reset }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return ctx;
}
