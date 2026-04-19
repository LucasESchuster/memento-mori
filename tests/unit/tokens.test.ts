import { describe, it, expect } from "vitest";
import { randomToken } from "@/lib/tokens";

describe("randomToken (Feature A.6)", () => {
  it("returns a hex string of length bytes*2 (default 32 bytes → 64 chars)", () => {
    const t = randomToken();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
    expect(t).toHaveLength(64);
  });

  it("honors an explicit byte length", () => {
    expect(randomToken(16)).toHaveLength(32);
    expect(randomToken(8)).toHaveLength(16);
  });

  it("produces different tokens on consecutive calls", () => {
    const a = randomToken();
    const b = randomToken();
    expect(a).not.toBe(b);
  });
});
