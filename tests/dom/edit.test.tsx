import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
} from "vitest";
import { render, screen } from "@testing-library/react";
import { installResendMock } from "@/tests/helpers/resend";
installResendMock();

import {
  prisma,
  truncate,
  ensureMigrated,
  createSubscription,
} from "@/tests/helpers/db";
import EditPage from "@/app/edit/page";

beforeAll(async () => {
  await ensureMigrated();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await truncate();
});

async function renderEditPage(searchParams: Record<string, string | undefined>) {
  const el = await EditPage({
    searchParams: Promise.resolve(searchParams),
  });
  return render(el);
}

describe("Edit page (Feature F.20)", () => {
  it("no token → 'link inválido.' + 'Token ausente.'", async () => {
    await renderEditPage({});
    expect(screen.getByText("link inválido.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Token ausente. Use o link de edição enviado por email.",
      ),
    ).toBeInTheDocument();
  });

  it("unknown token → 'Não encontramos esta inscrição.'", async () => {
    await renderEditPage({ token: "nope" });
    expect(screen.getByText("link inválido.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Não encontramos esta inscrição. O link pode ter expirado.",
      ),
    ).toBeInTheDocument();
  });

  it("unsubscribed → 'inscrição cancelada.' subtitle", async () => {
    await createSubscription({
      email: "gone@example.com",
      unsubscribeToken: "gone_tok",
      unsubscribedAt: new Date("2026-02-01T00:00:00Z"),
    });
    await renderEditPage({ token: "gone_tok" });
    expect(screen.getByText("inscrição cancelada.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Esta inscrição foi cancelada. Para voltar a receber, inscreva-se novamente na página inicial.",
      ),
    ).toBeInTheDocument();
  });

  it("valid active → renders EditForm with the user's values", async () => {
    await createSubscription({
      email: "active@example.com",
      unsubscribeToken: "live_tok",
      birthDate: new Date("1990-05-15T00:00:00Z"),
      lifeExpectancy: 85,
    });
    await renderEditPage({ token: "live_tok" });
    expect(screen.getByText("editar lembretes.")).toBeInTheDocument();
    expect(screen.getByText("active@example.com")).toBeInTheDocument();
    const dateInput = screen.getByLabelText(
      /data de nascimento/i,
    ) as HTMLInputElement;
    expect(dateInput.value).toBe("1990-05-15");
  });
});
