import { describe, it, expect } from "vitest";
import { weekOfLife } from "@/lib/weeks";

const MS_PER_DAY = 86_400_000;

describe("weekOfLife (Feature A.4)", () => {
  const birth = new Date("2020-01-01T00:00:00Z");

  it("returns 0 when now <= birthDate", () => {
    expect(weekOfLife(birth, birth)).toBe(0);
    expect(weekOfLife(birth, new Date(birth.getTime() - 1))).toBe(0);
  });

  it("returns 0 on day 6 (less than a week)", () => {
    const now = new Date(birth.getTime() + 6 * MS_PER_DAY);
    expect(weekOfLife(birth, now)).toBe(0);
  });

  it("returns 1 on day 7", () => {
    const now = new Date(birth.getTime() + 7 * MS_PER_DAY);
    expect(weekOfLife(birth, now)).toBe(1);
  });

  it("returns 2 on day 14", () => {
    const now = new Date(birth.getTime() + 14 * MS_PER_DAY);
    expect(weekOfLife(birth, now)).toBe(2);
  });

  it("floors toward the lower week boundary", () => {
    const now = new Date(birth.getTime() + 13 * MS_PER_DAY + MS_PER_DAY - 1);
    expect(weekOfLife(birth, now)).toBe(1);
  });

  it("computes large spans correctly", () => {
    const now = new Date(birth.getTime() + 52 * 7 * MS_PER_DAY);
    expect(weekOfLife(birth, now)).toBe(52);
  });
});
