import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

const STORAGE_KEY = "memento-mori:inputs";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("Home page (Feature F.19)", () => {
  it("first visit: form is visible, grid is hidden", async () => {
    render(<Home />);
    expect(await screen.findByLabelText(/data de nascimento/i)).toBeInTheDocument();
    expect(screen.queryByText(/sua vida em semanas/i)).not.toBeInTheDocument();
  });

  it("submitting a valid date persists to localStorage", async () => {
    const user = userEvent.setup();
    render(<Home />);
    const input = await screen.findByLabelText(/data de nascimento/i);
    await user.type(input, "1990-05-15");
    const submit = screen.getByRole("button", { name: /calcular/i });
    await user.click(submit);

    await waitFor(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toMatchObject({
        birthDate: "1990-05-15",
        lifeExpectancy: 80,
      });
    });
    expect(await screen.findByText(/sua vida em semanas/i)).toBeInTheDocument();
  });

  it("reload with stored inputs shows the grid without interaction", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ birthDate: "1990-05-15", lifeExpectancy: 80 }),
    );
    render(<Home />);
    expect(await screen.findByText(/sua vida em semanas/i)).toBeInTheDocument();
  });

  it("quote refresh rotates the quote (seeded Math.random)", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ birthDate: "1990-05-15", lifeExpectancy: 80 }),
    );
    // Start with a predictable quote (index 0 on first pick).
    let next = 0;
    vi.spyOn(Math, "random").mockImplementation(() => next);

    const user = userEvent.setup();
    render(<Home />);
    await screen.findByRole("button", { name: /nova citação/i });
    const firstAuthor = screen.getAllByText(/—/)[0]?.textContent ?? "";

    // Force a different pick on refresh.
    next = 0.5;
    await user.click(screen.getByRole("button", { name: /nova citação/i }));
    await waitFor(() => {
      const newAuthor = screen.getAllByText(/—/)[0]?.textContent ?? "";
      expect(newAuthor).not.toBe(firstAuthor);
    });
  });

  it("ignores malformed localStorage payload", async () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json{");
    expect(() => render(<Home />)).not.toThrow();
    // Should behave like a first-time visit: form visible, no grid.
    expect(
      await screen.findByLabelText(/data de nascimento/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/sua vida em semanas/i)).not.toBeInTheDocument();
  });
});
