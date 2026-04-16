const MS_PER_WEEK = 7 * 86_400_000;

export function weekOfLife(birthYear: number, now: Date = new Date()): number {
  const birth = new Date(birthYear, 0, 1).getTime();
  const diff = now.getTime() - birth;
  if (diff <= 0) return 0;
  return Math.floor(diff / MS_PER_WEEK);
}
