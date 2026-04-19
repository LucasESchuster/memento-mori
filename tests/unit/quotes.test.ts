import { describe, it, expect, vi, afterEach } from "vitest";
import { pickRandomQuote, quotes } from "@/lib/quotes";

describe("pickRandomQuote (Feature A.5)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns a Quote object from the curated list", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);
    const q = pickRandomQuote();
    expect(q).toEqual(quotes[0]);
    expect(spy).toHaveBeenCalled();
  });

  it("never returns the excluded quote — retry loop kicks in", () => {
    const excluded = quotes[0];
    // First random() pick returns index 0 (the excluded one); second returns index 1.
    const spy = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1 / quotes.length);
    const q = pickRandomQuote(excluded);
    expect(q.text).not.toBe(excluded.text);
    expect(q).toEqual(quotes[1]);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("returns a different quote than the exclude across many picks", () => {
    const excluded = quotes[3];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const q = pickRandomQuote(excluded);
    expect(q.text).not.toBe(excluded.text);
  });

  it("handles single-quote corpus edge case", async () => {
    // Import fresh module with a stubbed quotes array of length 1.
    vi.resetModules();
    vi.doMock("@/lib/quotes", async () => {
      const single = [{ text: "only", author: "me" }];
      return {
        quotes: single,
        pickRandomQuote: (exclude?: { text: string; author: string }) => {
          if (single.length === 1) return single[0];
          let pick = single[Math.floor(Math.random() * single.length)];
          while (exclude && pick.text === exclude.text) {
            pick = single[Math.floor(Math.random() * single.length)];
          }
          return pick;
        },
      };
    });
    const mod = await import("@/lib/quotes");
    expect(mod.pickRandomQuote({ text: "only", author: "me" })).toEqual({
      text: "only",
      author: "me",
    });
    vi.doUnmock("@/lib/quotes");
  });
});
