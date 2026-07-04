import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { verifyTurnstile } from "@/lib/turnstile";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.TURNSTILE_SECRET_KEY = "test_secret";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("verifyTurnstile (Feature B.7)", () => {
  it("fails open (returns true) when TURNSTILE_SECRET_KEY is unset", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyTurnstile("tok")).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns false without calling the network when the token is empty but a secret is set", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyTurnstile("")).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns true when siteverify responds success: true", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyTurnstile("tok", "1.2.3.4")).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("challenges.cloudflare.com");
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("test_secret");
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("1.2.3.4");
  });

  it("omits remoteip when ip is 'unknown' or absent", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await verifyTurnstile("tok", "unknown");
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.has("remoteip")).toBe(false);
  });

  it("returns false when siteverify responds success: false", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: false, "error-codes": ["invalid-input"] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyTurnstile("tok")).resolves.toBe(false);
  });

  it("returns false when the request throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyTurnstile("tok")).resolves.toBe(false);
  });
});
