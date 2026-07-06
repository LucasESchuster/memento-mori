"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LifeForm } from "@/components/LifeForm";
import { isValidBirthDate } from "@/lib/calculations";

type Props = {
  token: string;
  email: string;
  initialBirthDate: string;
  initialLifeExpectancy: number;
};

type Status = "idle" | "saving" | "saved" | "error";
type DeleteStatus = "idle" | "confirm" | "deleting" | "deleted" | "error";

export function EditForm({
  token,
  email,
  initialBirthDate,
  initialLifeExpectancy,
}: Props) {
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [lifeExpectancy, setLifeExpectancy] = useState(initialLifeExpectancy);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>("idle");
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  async function handleDelete() {
    // First click arms the confirmation; the second click actually deletes.
    if (deleteStatus === "idle" || deleteStatus === "error") {
      setDeleteStatus("confirm");
      setDeleteMessage(null);
      return;
    }
    if (deleteStatus !== "confirm") return;
    setDeleteStatus("deleting");
    try {
      const res = await fetch(
        `/api/subscription?token=${encodeURIComponent(token)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setDeleteStatus("error");
        setDeleteMessage(
          data?.error === "not_found"
            ? "Link inválido ou os dados já foram apagados."
            : "Não foi possível apagar. Tente novamente.",
        );
        return;
      }
      setDeleteStatus("deleted");
    } catch {
      setDeleteStatus("error");
      setDeleteMessage("Erro de rede. Tente novamente.");
    }
  }

  async function handleSubmit() {
    if (!isValidBirthDate(birthDate)) return;
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch(
        `/api/subscription?token=${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            birthDate,
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
            ? "Dados inválidos. Verifique a data e a expectativa."
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

  if (deleteStatus === "deleted") {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col gap-3"
      >
        <p className="font-serif text-xl italic text-neutral-900">
          Seus dados foram apagados permanentemente.
        </p>
        <p className="font-serif text-sm italic text-neutral-500">
          Não guardamos mais nenhuma informação sua. Você deixará de receber os
          lembretes.
        </p>
      </motion.section>
    );
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
        birthDate={birthDate}
        lifeExpectancy={lifeExpectancy}
        onBirthDateChange={(value) => {
          setBirthDate(value);
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

      <div className="flex flex-col gap-3 border-t border-neutral-200 pt-8">
        <p className="text-sm tracking-wide text-neutral-500">
          Apagar meus dados
        </p>
        <p className="font-serif text-sm italic text-neutral-500">
          Remove permanentemente seu email e suas preferências dos nossos
          registros (LGPD, art. 18). Esta ação não pode ser desfeita.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteStatus === "deleting"}
          className="self-start border-b border-neutral-400 pb-0.5 font-mono text-[11px] tracking-[0.2em] text-neutral-600 uppercase transition-colors hover:border-red-700 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleteStatus === "deleting"
            ? "Apagando..."
            : deleteStatus === "confirm"
              ? "Confirmar exclusão permanente?"
              : "Apagar meus dados"}
        </button>
        {deleteStatus === "confirm" && (
          <p className="font-serif text-sm italic text-neutral-500">
            Clique novamente para confirmar.
          </p>
        )}
        {deleteStatus === "error" && deleteMessage && (
          <p className="font-serif text-sm italic text-neutral-600">
            {deleteMessage}
          </p>
        )}
      </div>
    </motion.section>
  );
}
