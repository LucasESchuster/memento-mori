import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the Turnstile widget: on mount it invokes onSuccess with a fake token,
// mirroring a solved captcha so the submit button becomes enabled.
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({
    onSuccess,
    onExpire,
  }: {
    onSuccess?: (t: string) => void;
    onExpire?: () => void;
  }) => {
    useEffect(() => {
      onSuccess?.("captcha-token");
    }, [onSuccess]);
    // Exposes an expiry trigger so tests can drive the token-cleared path.
    return (
      <button type="button" data-testid="turnstile-expire" onClick={onExpire}>
        expire
      </button>
    );
  },
}));

const ORIGINAL_ENV = { ...process.env };

async function importSection() {
  // The site key is read at module scope, so set it before importing.
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-site-key";
  vi.resetModules();
  return (await import("@/components/SubscribeSection")).SubscribeSection;
}

function mockFetchOnce(response: {
  ok: boolean;
  status?: number;
  body: unknown;
}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 400),
    json: async () => response.body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SubscribeSection — Turnstile (Feature B.7)", () => {
  it("includes the turnstileToken in the POST body once the captcha resolves", async () => {
    const SubscribeSection = await importSection();
    const user = userEvent.setup();
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 201,
      body: { status: "confirmation_sent", id: "abc" },
    });
    render(
      <SubscribeSection
        birthDate="1990-05-15"
        lifeExpectancy={80}
        canSubmit
      />,
    );

    await user.type(screen.getByLabelText(/seu email/i), "me@example.com");
    await user.click(screen.getByLabelText(/política de privacidade/i));
    await user.click(
      screen.getByRole("button", { name: /receber lembretes/i }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      email: "me@example.com",
      birthDate: "1990-05-15",
      lifeExpectancy: 80,
      turnstileToken: "captcha-token",
      consent: true,
    });
  });

  it("shows the captcha error message on captcha_failed", async () => {
    const SubscribeSection = await importSection();
    const user = userEvent.setup();
    mockFetchOnce({
      ok: false,
      status: 400,
      body: { error: "captcha_failed" },
    });
    render(
      <SubscribeSection
        birthDate="1990-05-15"
        lifeExpectancy={80}
        canSubmit
      />,
    );
    await user.type(screen.getByLabelText(/seu email/i), "me@example.com");
    await user.click(screen.getByLabelText(/política de privacidade/i));
    await user.click(
      screen.getByRole("button", { name: /receber lembretes/i }),
    );
    expect(
      await screen.findByText(
        "Falha na verificação anti-robô. Tente novamente.",
      ),
    ).toBeInTheDocument();
  });

  it("disables the submit button again when the captcha expires", async () => {
    const SubscribeSection = await importSection();
    const user = userEvent.setup();
    render(
      <SubscribeSection
        birthDate="1990-05-15"
        lifeExpectancy={80}
        canSubmit
      />,
    );
    await user.type(screen.getByLabelText(/seu email/i), "me@example.com");
    await user.click(screen.getByLabelText(/política de privacidade/i));
    const submit = screen.getByRole("button", {
      name: /receber lembretes/i,
    });
    expect(submit).toBeEnabled();

    await user.click(screen.getByTestId("turnstile-expire"));
    expect(submit).toBeDisabled();
  });
});
