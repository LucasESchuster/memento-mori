"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { isValidBirthYear } from "@/lib/calculations";

type Props = {
  birthYear: string;
  lifeExpectancy: number;
  onBirthYearChange: (value: string) => void;
  onLifeExpectancyChange: (value: number) => void;
  onSubmit: () => void;
};

export function LifeForm({
  birthYear,
  lifeExpectancy,
  onBirthYearChange,
  onLifeExpectancyChange,
  onSubmit,
}: Props) {
  const parsed = Number(birthYear);
  const canSubmit = birthYear.length > 0 && isValidBirthYear(parsed);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="birth-year"
          className="text-sm tracking-wide text-neutral-500"
        >
          Ano de nascimento
        </label>
        <Input
          id="birth-year"
          type="number"
          inputMode="numeric"
          min={1900}
          max={new Date().getFullYear()}
          placeholder="1990"
          value={birthYear}
          onChange={(e) => onBirthYearChange(e.target.value)}
          className="h-11 rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 text-lg font-light tracking-wide shadow-none transition-colors focus-visible:border-neutral-900 focus-visible:ring-0 md:text-lg"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="life-expectancy"
            className="text-sm tracking-wide text-neutral-500"
          >
            Expectativa de vida
          </label>
          <span className="font-serif text-2xl text-neutral-900">
            {lifeExpectancy}
            <span className="ml-1 text-sm text-neutral-400">anos</span>
          </span>
        </div>
        <Slider
          id="life-expectancy"
          min={60}
          max={100}
          step={1}
          value={[lifeExpectancy]}
          onValueChange={(v) => onLifeExpectancyChange(v[0])}
          className="py-2"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-2 h-11 rounded-none border border-neutral-900 bg-neutral-900 px-6 text-sm tracking-[0.2em] text-white uppercase transition-colors hover:bg-white hover:text-neutral-900 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:hover:bg-neutral-100 disabled:hover:text-neutral-400"
      >
        Calcular
      </button>
    </form>
  );
}
