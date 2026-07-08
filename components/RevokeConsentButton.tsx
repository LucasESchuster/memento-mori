"use client";

import { useConsent } from "@/components/ConsentProvider";

export function RevokeConsentButton() {
  const { consent, hydrated, reset } = useConsent();

  function handleRevoke() {
    reset();
    // Reload so the banner reappears and any already-loaded Clarity script is
    // dropped from the page.
    window.location.reload();
  }

  const label =
    !hydrated || consent === null
      ? "Você ainda não decidiu sobre os cookies de análise."
      : consent === "granted"
        ? "Você autorizou os cookies de análise."
        : "Você recusou os cookies de análise.";

  return (
    <span>
      {label}{" "}
      <button
        type="button"
        onClick={handleRevoke}
        className="border-b border-[color:var(--ink-soft)] font-sans text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]"
      >
        Rever minha escolha
      </button>
      .
    </span>
  );
}
