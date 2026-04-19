import { describe, it, expect } from "vitest";
import {
  calculateLifeStats,
  isValidBirthDate,
  parseBirthDate,
} from "@/lib/calculations";

const NOW = new Date("2026-04-19T12:00:00Z");

describe("calculateLifeStats (Feature A.1)", () => {
  it("returns all zeros for a newborn (birthDate === now)", () => {
    const stats = calculateLifeStats(NOW, 80, NOW);
    expect(stats.yearsLived).toBe(0);
    expect(stats.weeksLived).toBe(0);
    expect(stats.percentLived).toBe(0);
    expect(stats.yearsRemaining).toBe(80);
    expect(stats.weeksRemaining).toBe(stats.totalWeeks);
    expect(stats.daysRemaining).toBeGreaterThan(0);
  });

  it("reports ~50% at mid-life (40y into 80y)", () => {
    const birth = new Date(NOW.getTime() - 40 * 365.25 * 86_400_000);
    const stats = calculateLifeStats(birth, 80, NOW);
    expect(stats.yearsLived).toBe(40);
    expect(stats.yearsRemaining).toBe(40);
    expect(stats.percentLived).toBeCloseTo(50, 1);
  });

  it("clamps values past lifeExpectancy", () => {
    const birth = new Date("1900-01-01T00:00:00Z");
    const stats = calculateLifeStats(birth, 80, NOW);
    expect(stats.yearsLived).toBeLessThanOrEqual(80);
    expect(stats.yearsLived).toBe(80);
    expect(stats.yearsRemaining).toBe(0);
    expect(stats.percentLived).toBeLessThanOrEqual(100);
    expect(stats.percentLived).toBe(100);
    expect(stats.weeksLived).toBeLessThanOrEqual(stats.totalWeeks);
    expect(stats.weeksLived).toBe(stats.totalWeeks);
    expect(stats.weeksRemaining).toBe(0);
    expect(stats.daysRemaining).toBeGreaterThanOrEqual(0);
  });

  it("clamps msLived to 0 for a future birthDate", () => {
    const futureBirth = new Date(NOW.getTime() + 10 * 86_400_000);
    const stats = calculateLifeStats(futureBirth, 80, NOW);
    expect(stats.yearsLived).toBe(0);
    expect(stats.weeksLived).toBe(0);
    expect(stats.percentLived).toBe(0);
    expect(stats.daysRemaining).toBeGreaterThan(0);
  });

  it("uses DAYS_PER_YEAR = 365.25 for leap-year boundaries", () => {
    // Exactly 4 Julian years (= 1461 days).
    const birth = new Date(NOW.getTime() - 4 * 365.25 * 86_400_000);
    const stats = calculateLifeStats(birth, 80, NOW);
    expect(stats.yearsLived).toBe(4);
  });

  it("totalWeeks === Math.round(lifeExpectancy * 52)", () => {
    for (const le of [60, 72, 80, 91, 100]) {
      const stats = calculateLifeStats(NOW, le, NOW);
      expect(stats.totalWeeks).toBe(Math.round(le * 52));
    }
  });
});

describe("isValidBirthDate (Feature A.2)", () => {
  it("accepts valid YYYY-MM-DD between 1900-01-01 and now", () => {
    expect(isValidBirthDate("1990-05-15", NOW)).toBe(true);
    expect(isValidBirthDate("1900-01-01", NOW)).toBe(true);
    expect(isValidBirthDate("2026-04-19", NOW)).toBe(true);
  });

  it("rejects malformed strings", () => {
    expect(isValidBirthDate("not-a-date", NOW)).toBe(false);
    expect(isValidBirthDate("", NOW)).toBe(false);
    expect(isValidBirthDate("2026-13-01", NOW)).toBe(false);
  });

  it("rejects dates before 1900", () => {
    expect(isValidBirthDate("1899-12-31", NOW)).toBe(false);
    expect(isValidBirthDate("1800-06-01", NOW)).toBe(false);
  });

  it("rejects dates after now", () => {
    expect(isValidBirthDate("2030-01-01", NOW)).toBe(false);
  });
});

describe("parseBirthDate (Feature A.3)", () => {
  it("returns a Date at local midnight", () => {
    const d = parseBirthDate("1990-05-15");
    expect(d.getFullYear()).toBe(1990);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("round-trips with isValidBirthDate", () => {
    const input = "1995-03-14";
    expect(isValidBirthDate(input, NOW)).toBe(true);
    const d = parseBirthDate(input);
    expect(isNaN(d.getTime())).toBe(false);
  });
});
