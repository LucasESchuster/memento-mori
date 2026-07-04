"use client";

type Props = {
  onAccept: () => void;
  onDismiss: () => void;
};

export function LetterInvitePopup({ onAccept, onDismiss }: Props) {
  return (
    <div
      role="dialog"
      aria-label="Sugestão de carta semanal"
      className="mm-invite-anim fixed bottom-8 right-8 z-50 w-[360px] max-w-[calc(100vw-64px)] border border-[color:var(--ink)] bg-[color:var(--paper)] p-7 font-serif shadow-lg"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="mm-breathe inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--terracotta)]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[color:var(--terracotta)]">
            Sugestão · carta semanal
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar"
          className="-m-1 border-0 bg-transparent p-1 font-mono text-sm leading-none text-[color:var(--ink-mute)]"
        >
          ×
        </button>
      </div>

      <h3
        className="mb-3 font-serif font-normal text-[color:var(--ink)]"
        style={{ fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.015em" }}
      >
        Quer receber uma{" "}
        <em className="text-[color:var(--terracotta)]">carta</em> a cada semana que passa?
      </h3>
      <p
        className="mb-6 font-serif italic text-[color:var(--ink-soft)]"
        style={{ fontWeight: 300, fontSize: 16, lineHeight: 1.5 }}
      >
        A cada semana completada da sua vida, um breve email: quantas semanas restam, e
        uma meditação para a semana à frente.
      </p>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex w-full items-center justify-center gap-3 border-0 bg-[color:var(--ink)] py-3.5 font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--paper)]"
        >
          <span>Sim, quero receber</span>
          <span className="text-xs">↓</span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full border-0 bg-transparent py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-fade)]"
        >
          agora não
        </button>
      </div>
    </div>
  );
}
