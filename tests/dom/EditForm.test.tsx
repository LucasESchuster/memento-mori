import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditForm } from "@/components/EditForm";

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

function renderForm(props: Partial<React.ComponentProps<typeof EditForm>> = {}) {
  return render(
    <EditForm
      token="tok_abc"
      email="user@example.com"
      initialBirthDate="1990-05-15"
      initialLifeExpectancy={80}
      {...props}
    />,
  );
}

describe("EditForm (Feature E.16)", () => {
  it("PATCHes /api/subscription with token and body", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      body: { status: "updated" },
    });
    renderForm();
    await user.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/subscription?token=tok_abc");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({
      birthDate: "1990-05-15",
      lifeExpectancy: 80,
    });
  });

  it("on success renders 'Suas preferências foram atualizadas.'", async () => {
    const user = userEvent.setup();
    mockFetchOnce({ ok: true, status: 200, body: { status: "updated" } });
    renderForm();
    await user.click(screen.getByRole("button", { name: /salvar/i }));
    expect(
      await screen.findByText("Suas preferências foram atualizadas."),
    ).toBeInTheDocument();
  });

  it("on 404 not_found renders 'Link inválido ou expirado.'", async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      ok: false,
      status: 404,
      body: { error: "not_found" },
    });
    renderForm();
    await user.click(screen.getByRole("button", { name: /salvar/i }));
    expect(
      await screen.findByText("Link inválido ou expirado."),
    ).toBeInTheDocument();
  });

  it("on 400 invalid_input renders the invalid-data message", async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      ok: false,
      status: 400,
      body: { error: "invalid_input" },
    });
    renderForm();
    await user.click(screen.getByRole("button", { name: /salvar/i }));
    expect(
      await screen.findByText(
        "Dados inválidos. Verifique a data e a expectativa.",
      ),
    ).toBeInTheDocument();
  });

  it("on network error renders 'Erro de rede. Tente novamente.'", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockRejectedValue(new Error("down"));
    vi.stubGlobal("fetch", fetchMock);
    renderForm();
    await user.click(screen.getByRole("button", { name: /salvar/i }));
    expect(
      await screen.findByText("Erro de rede. Tente novamente."),
    ).toBeInTheDocument();
  });
});
