"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LifeForm } from "@/components/LifeForm";
import { isValidBirthYear } from "@/lib/calculations";

type Props = {
  token: string;
  email: string;
  initialBirthYear: number;
  initialLifeExpectancy: number;
};

type Status = "idle" | "saving" | "saved" | "error";

export function EditForm({
  token,
  email,
  initialBirthYear,
  initialLifeExpectancy,
}: Props) {
  const [birthYear, setBirthYear] = useState(String(initialBirthYear));
  const [lifeExpectancy, setLifeExpectancy] = useState(initialLifeExpectancy);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    const parsed = Number(birthYear);
    if (!isValidBirthYear(parsed)) return;
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch(
        `/api/subscription?token=${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            birthYear: parsed,
            lifeExpectancy,
          }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setStatus("error");
        setMessage(
          data?.error === "invalid_input"
            ? "Dados inválidos. Verifique o ano e a expectativa."
            : data?.error === "not_found"
              ? "Link inválido ou expirado."
              : "Não foi possível salvar. Tente novamente.",
        );
        return;
      }
      setStatus("saved");
      setMessage("Suas preferências foram atualizadas.");
    } catch {
      setStatus("error");
      setMessage("Erro de rede. Tente novamente.");
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm tracking-wide text-neutral-500">
          Editando preferências de
        </p>
        <p className="font-serif text-xl text-neutral-900">{email}</p>
      </div>

      <LifeForm
        birthYear={birthYear}
        lifeExpectancy={lifeExpectancy}
        onBirthYearChange={(value) => {
          setBirthYear(value);
          if (status === "saved") setStatus("idle");
        }}
        onLifeExpectancyChange={(value) => {
          setLifeExpectancy(value);
          if (status === "saved") setStatus("idle");
        }}
        onSubmit={handleSubmit}
        submitLabel="Salvar"
      />

      {status === "saving" && (
        <p className="font-serif text-sm italic text-neutral-500">
          Salvando...
        </p>
      )}
      {message && status !== "saving" && (
        <p
          className={
            status === "error"
              ? "font-serif text-sm italic text-neutral-600"
              : "font-serif text-base italic text-neutral-700"
          }
        >
          {message}
        </p>
      )}
    </motion.section>
  );
}
