import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscribeForm } from "@/components/SubscribeForm";

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
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SubscribeForm (Feature E.15)", () => {
  it("POSTs { email, birthDate, lifeExpectancy } to /api/subscribe", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 201,
      body: { status: "confirmation_sent", id: "abc" },
    });
    render(<SubscribeForm birthDate="1990-05-15" lifeExpectancy={80} />);

    await user.type(screen.getByLabelText(/email/i), "me@example.com");
    await user.click(screen.getByRole("button", { name: /receber lembretes/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/subscribe");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      email: "me@example.com",
      birthDate: "1990-05-15",
      lifeExpectancy: 80,
    });
  });

  it("on success renders the confirmation message with the email", async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      ok: true,
      status: 201,
      body: { status: "confirmation_sent", id: "abc" },
    });
    render(<SubscribeForm birthDate="1990-05-15" lifeExpectancy={80} />);
    await user.type(screen.getByLabelText(/email/i), "me@example.com");
    await user.click(screen.getByRole("button", { name: /receber lembretes/i }));

    expect(
      await screen.findByText(
        "Enviamos um email de confirmação para me@example.com. Abra-o para ativar a inscrição.",
      ),
    ).toBeInTheDocument();
  });

  it("on already_subscribed renders the already-active message", async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      ok: true,
      status: 200,
      body: { status: "already_subscribed" },
    });
    render(<SubscribeForm birthDate="1990-05-15" lifeExpectancy={80} />);
    await user.type(screen.getByLabelText(/email/i), "me@example.com");
    await user.click(screen.getByRole("button", { name: /receber lembretes/i }));
    expect(
      await screen.findByText(
        "Este email já está inscrito e ativo. Você continua recebendo os lembretes.",
      ),
    ).toBeInTheDocument();
  });

  it("on 429 renders the rate-limit message", async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      ok: false,
      status: 429,
      body: { error: "too_many_requests" },
    });
    render(<SubscribeForm birthDate="1990-05-15" lifeExpectancy={80} />);
    await user.type(screen.getByLabelText(/email/i), "me@example.com");
    await user.click(screen.getByRole("button", { name: /receber lembretes/i }));
    expect(
      await screen.findByText("Muitas tentativas. Tente novamente em uma hora."),
    ).toBeInTheDocument();
  });

  it("on 400 invalid_input renders the invalid-data message", async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      ok: false,
      status: 400,
      body: { error: "invalid_input" },
    });
    render(<SubscribeForm birthDate="1990-05-15" lifeExpectancy={80} />);
    await user.type(screen.getByLabelText(/email/i), "me@example.com");
    await user.click(screen.getByRole("button", { name: /receber lembretes/i }));
    expect(
      await screen.findByText("Dados inválidos. Verifique o email."),
    ).toBeInTheDocument();
  });

  it("on network error renders the network-error message", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    render(<SubscribeForm birthDate="1990-05-15" lifeExpectancy={80} />);
    await user.type(screen.getByLabelText(/email/i), "me@example.com");
    await user.click(screen.getByRole("button", { name: /receber lembretes/i }));
    expect(
      await screen.findByText("Erro de rede. Tente novamente."),
    ).toBeInTheDocument();
  });

  it("double-click is a no-op while sending (guarded by state)", async () => {
    const user = userEvent.setup();
    let resolve!: (v: Response) => void;
    const pending = new Promise<Response>((r) => (resolve = r));
    const fetchMock = vi.fn().mockReturnValue(pending);
    vi.stubGlobal("fetch", fetchMock);

    render(<SubscribeForm birthDate="1990-05-15" lifeExpectancy={80} />);
    await user.type(screen.getByLabelText(/email/i), "me@example.com");
    const btn = screen.getByRole("button", { name: /receber lembretes/i });
    await user.click(btn);
    // While sending, button should be disabled; clicking again does nothing.
    await user.click(btn);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Wrap up so vitest can GC the promise.
    resolve({
      ok: true,
      status: 201,
      json: async () => ({ status: "confirmation_sent", id: "x" }),
    } as Response);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /enviando/i }),
      ).not.toBeInTheDocument(),
    );
  });
});
