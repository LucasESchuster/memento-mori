import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConsentProvider } from "@/components/ConsentProvider";
import { CookieConsent } from "@/components/CookieConsent";
import { RevokeConsentButton } from "@/components/RevokeConsentButton";
import Clarity from "@/components/Clarity";

const CONSENT_KEY = "memento-mori:consent";

// usePathname is read by <Clarity>; a mutable holder lets each test pick a route.
const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  window.localStorage.clear();
  nav.pathname = "/";
  document.getElementById("ms-clarity")?.remove();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  window.localStorage.clear();
  document.getElementById("ms-clarity")?.remove();
  vi.restoreAllMocks();
});

describe("CookieConsent banner (LGPD opt-in)", () => {
  it("shows the banner when no decision is stored and grants consent on accept", async () => {
    const user = userEvent.setup();
    render(
      <ConsentProvider>
        <CookieConsent />
      </ConsentProvider>,
    );

    const banner = await screen.findByRole("dialog", {
      name: "Consentimento de cookies",
    });
    expect(banner).toBeInTheDocument();
    // Vendor is intentionally not named in the short notice.
    expect(banner).not.toHaveTextContent(/clarity/i);

    await user.click(screen.getByRole("button", { name: /sim, pode/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Consentimento de cookies" }),
      ).not.toBeInTheDocument(),
    );
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("granted");
  });

  it("stores a denial and hides the banner on 'agora não'", async () => {
    const user = userEvent.setup();
    render(
      <ConsentProvider>
        <CookieConsent />
      </ConsentProvider>,
    );

    await screen.findByRole("dialog", { name: "Consentimento de cookies" });
    await user.click(screen.getByRole("button", { name: /agora não/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Consentimento de cookies" }),
      ).not.toBeInTheDocument(),
    );
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("denied");
  });

  it("does not render the banner when a decision is already stored", async () => {
    window.localStorage.setItem(CONSENT_KEY, "granted");
    render(
      <ConsentProvider>
        <CookieConsent />
      </ConsentProvider>,
    );

    // Let the provider hydrate; the banner must stay absent.
    await waitFor(() =>
      expect(window.localStorage.getItem(CONSENT_KEY)).toBe("granted"),
    );
    expect(
      screen.queryByRole("dialog", { name: "Consentimento de cookies" }),
    ).not.toBeInTheDocument();
  });

  it("ignores a malformed stored value and shows the banner", async () => {
    window.localStorage.setItem(CONSENT_KEY, "garbage");
    render(
      <ConsentProvider>
        <CookieConsent />
      </ConsentProvider>,
    );
    expect(
      await screen.findByRole("dialog", { name: "Consentimento de cookies" }),
    ).toBeInTheDocument();
  });
});

describe("RevokeConsentButton", () => {
  it("reflects the stored decision and clears it on revoke", async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    });

    window.localStorage.setItem(CONSENT_KEY, "granted");
    const user = userEvent.setup();
    render(
      <ConsentProvider>
        <RevokeConsentButton />
      </ConsentProvider>,
    );

    expect(
      await screen.findByText(/você autorizou os cookies de análise/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /rever minha escolha/i }));

    expect(window.localStorage.getItem(CONSENT_KEY)).toBeNull();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});

describe("Clarity consent gate", () => {
  it("does not inject the Clarity script without consent", async () => {
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "abc123";
    render(
      <ConsentProvider>
        <Clarity />
      </ConsentProvider>,
    );

    // Give effects a chance to run, then assert nothing was injected.
    await waitFor(() => expect(document.body).toBeInTheDocument());
    expect(document.getElementById("ms-clarity")).toBeNull();
  });

  it("injects the Clarity script once consent is granted", async () => {
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "abc123";
    window.localStorage.setItem(CONSENT_KEY, "granted");
    render(
      <ConsentProvider>
        <Clarity />
      </ConsentProvider>,
    );

    await waitFor(() =>
      expect(document.getElementById("ms-clarity")).not.toBeNull(),
    );
    expect(document.getElementById("ms-clarity")?.innerHTML).toContain("abc123");
  });

  it("never injects on a tokenized path even with consent", async () => {
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "abc123";
    window.localStorage.setItem(CONSENT_KEY, "granted");
    nav.pathname = "/edit";
    render(
      <ConsentProvider>
        <Clarity />
      </ConsentProvider>,
    );

    await waitFor(() => expect(document.body).toBeInTheDocument());
    expect(document.getElementById("ms-clarity")).toBeNull();
  });

  it("does not inject when the project id is missing or invalid", async () => {
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = "INVALID ID";
    window.localStorage.setItem(CONSENT_KEY, "granted");
    render(
      <ConsentProvider>
        <Clarity />
      </ConsentProvider>,
    );

    await waitFor(() => expect(document.body).toBeInTheDocument());
    expect(document.getElementById("ms-clarity")).toBeNull();
  });
});

describe("useConsent guard", () => {
  it("throws when used outside a ConsentProvider", () => {
    // Render RevokeConsentButton (a useConsent consumer) with no provider.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<RevokeConsentButton />)).toThrow(
      /useConsent must be used within a ConsentProvider/i,
    );
    spy.mockRestore();
  });
});
