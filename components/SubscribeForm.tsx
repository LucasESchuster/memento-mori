"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

type Props = {
  birthDate: string;
  lifeExpectancy: number;
};

type Status = "idle" | "sending" | "sent" | "error";

export function SubscribeForm({ birthDate, lifeExpectancy }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, birthDate, lifeExpectancy }),
      });
      const data = (await res.json().catch(() => null)) as
        | { status?: string; error?: string }
        | null;
      if (!res.ok) {
        setStatus("error");
        setMessage(
          data?.error === "too_many_requests"
            ? "Muitas tentativas. Tente novamente em uma hora."
            : data?.error === "invalid_input"
              ? "Dados inválidos. Verifique o email."
              : "Não foi possível inscrever. Tente novamente em instantes.",
        );
        return;
      }
      if (data?.status === "already_subscribed") {
        setStatus("sent");
        setMessage(
          `Este email já está inscrito e ativo. Você continua recebendo os lembretes.`,
        );
        return;
      }
      setStatus("sent");
      setMessage(
        `Enviamos um email de confirmação para ${email}. Abra-o para ativar a inscrição.`,
      );
    } catch {
      setStatus("error");
      setMessage("Erro de rede. Tente novamente.");
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className="flex flex-col gap-4 border-t border-neutral-200 pt-8"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-2xl font-light text-neutral-900">
          Receba um lembrete semanal
        </h2>
        <p className="font-serif text-sm italic text-neutral-500">
          Um email a cada semana de vida completada, até o fim dos seus dias.
        </p>
      </div>

      {status === "sent" ? (
        <p className="font-serif text-base italic text-neutral-700">
          {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="subscribe-email" className="sr-only">
            Email
          </label>
          <Input
            id="subscribe-email"
            type="email"
            required
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "sending"}
            className="h-11 rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 text-base font-light tracking-wide shadow-none transition-colors focus-visible:border-neutral-900 focus-visible:ring-0 md:text-base"
          />
          <button
            type="submit"
            disabled={status === "sending" || !email}
            className="h-11 rounded-none border border-neutral-900 bg-neutral-900 px-6 text-sm tracking-[0.2em] text-white uppercase transition-colors hover:bg-white hover:text-neutral-900 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:hover:bg-neutral-100 disabled:hover:text-neutral-400"
          >
            {status === "sending" ? "Enviando..." : "Receber lembretes"}
          </button>
          {status === "error" && message && (
            <p className="font-serif text-sm italic text-neutral-600">
              {message}
            </p>
          )}
          <p className="font-serif text-xs italic text-neutral-400">
            Você pode cancelar a qualquer momento com um clique.
          </p>
        </form>
      )}
    </motion.section>
  );
}
