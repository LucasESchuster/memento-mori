export type LifeStats = {
  yearsLived: number;
  yearsRemaining: number;
  weeksLived: number;
  weeksRemaining: number;
  daysRemaining: number;
  percentLived: number;
  totalWeeks: number;
};

const MS_PER_DAY = 86_400_000;
const DAYS_PER_YEAR = 365.25;
const WEEKS_PER_YEAR = 52;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateLifeStats(
  birthYear: number,
  lifeExpectancy: number,
  now: Date = new Date(),
): LifeStats {
  const birthDate = new Date(birthYear, 0, 1);
  const msLived = Math.max(0, now.getTime() - birthDate.getTime());
  const daysLived = msLived / MS_PER_DAY;

  const yearsLivedRaw = daysLived / DAYS_PER_YEAR;
  const yearsLived = clamp(Math.floor(yearsLivedRaw), 0, lifeExpectancy);
  const yearsRemaining = Math.max(0, lifeExpectancy - yearsLived);

  const totalWeeks = Math.round(lifeExpectancy * WEEKS_PER_YEAR);
  const weeksLived = clamp(Math.floor(daysLived / 7), 0, totalWeeks);
  const weeksRemaining = Math.max(0, totalWeeks - weeksLived);

  const totalDays = Math.round(lifeExpectancy * DAYS_PER_YEAR);
  const daysRemaining = Math.max(0, totalDays - Math.floor(daysLived));

  const percentLived = clamp((yearsLivedRaw / lifeExpectancy) * 100, 0, 100);

  return {
    yearsLived,
    yearsRemaining,
    weeksLived,
    weeksRemaining,
    daysRemaining,
    percentLived,
    totalWeeks,
  };
}

export function isValidBirthYear(value: number, now: Date = new Date()): boolean {
  return Number.isInteger(value) && value >= 1900 && value <= now.getFullYear();
}
