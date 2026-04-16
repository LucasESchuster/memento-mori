const MS_PER_WEEK = 7 * 86_400_000;

export function weekOfLife(birthDate: Date, now: Date = new Date()): number {
  const diff = now.getTime() - birthDate.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / MS_PER_WEEK);
}
