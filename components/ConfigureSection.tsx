"use client";

type Props = {
  birthDate: string;
  lifeExpectancy: number;
  onBirthDateChange: (value: string) => void;
  onLifeExpectancyChange: (value: number) => void;
  today: string;
};

export function ConfigureSection({
  birthDate,
  lifeExpectancy,
  onBirthDateChange,
  onLifeExpectancyChange,
  today,
}: Props) {
  return (
    <section
      id="configurar"
      className="mx-auto max-w-[1240px] px-6 pb-24 md:px-12 md:pb-32"
    >
      <div className="grid gap-12 md:grid-cols-[320px_1fr] md:items-start md:gap-20">
        <div>
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-[color:var(--terracotta)]">
            I. Ajuste o espelho
          </div>
          <h2
            className="mb-5 font-serif font-normal text-[color:var(--ink)]"
            style={{ fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
          >
            Diga-nos <em className="text-[color:var(--ink-soft)]">quando</em> começou.
          </h2>
          <p
            className="font-serif italic text-[color:var(--ink-mute)]"
            style={{ fontWeight: 300, fontSize: 18, lineHeight: 1.55 }}
          >
            Os cálculos ajustam-se em tempo real. Nada é armazenado. O espelho é privado.
          </p>
        </div>

        <div className="border border-[color:var(--rule)] bg-[color:var(--cream)] p-8 md:p-12">
          <div className="mb-10">
            <div className="mb-3 flex items-baseline justify-between">
              <label
                htmlFor="birth-date"
                className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-mute)]"
              >
                Data de nascimento
              </label>
              <span className="font-mono text-[10px] tracking-[0.18em] text-[color:var(--terracotta)]">
                ◦ obrigatório
              </span>
            </div>
            <input
              id="birth-date"
              type="date"
              className="mm-date w-full border-0 border-b border-[color:var(--ink)] bg-transparent px-0 py-3 font-serif text-[28px] font-normal text-[color:var(--ink)] outline-none md:text-[32px]"
              min="1900-01-01"
              max={today}
              value={birthDate}
              onChange={(e) => onBirthDateChange(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <label
                htmlFor="life-expectancy"
                className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-mute)]"
              >
                Expectativa de vida
              </label>
              <span className="font-serif text-[28px] text-[color:var(--ink)]">
                {lifeExpectancy}{" "}
                <span className="text-sm italic text-[color:var(--ink-mute)]">anos</span>
              </span>
            </div>
            <input
              id="life-expectancy"
              type="range"
              min={40}
              max={110}
              step={1}
              value={lifeExpectancy}
              onChange={(e) => onLifeExpectancyChange(parseInt(e.target.value, 10))}
              className="mm-range"
              aria-label="Expectativa de vida"
            />
            <div className="mt-2 flex justify-between font-mono text-[10px] tracking-[0.14em] text-[color:var(--cream-strong)]">
              <span>40</span>
              <span>75</span>
              <span>110</span>
            </div>
          </div>

          <div className="mt-8 border-t border-[color:var(--rule)] pt-6 font-serif text-[15px] italic leading-relaxed text-[color:var(--ink-mute)]">
            A expectativa média no Brasil hoje é ≈76 anos. Mas isto é apenas uma média. A
            sua história é sua.
          </div>
        </div>
      </div>
    </section>
  );
}
