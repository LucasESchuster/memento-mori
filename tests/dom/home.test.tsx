import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
  it("first visit: form is visible and the hero shows the waiting state", async () => {
    render(<Home />);
    expect(await screen.findByLabelText(/data de nascimento/i)).toBeInTheDocument();
    expect(screen.getByText(/aguardando início/i)).toBeInTheDocument();
  });

  it("typing a valid date persists to localStorage in real time", async () => {
    const user = userEvent.setup();
    render(<Home />);
    const input = await screen.findByLabelText(/data de nascimento/i);
    await user.type(input, "1990-05-15");

    await waitFor(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toMatchObject({
        birthDate: "1990-05-15",
        lifeExpectancy: 80,
      });
    });
    expect(await screen.findByText(/você está vivo há/i)).toBeInTheDocument();
  });

  it("reload with stored inputs shows the lived state without interaction", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ birthDate: "1990-05-15", lifeExpectancy: 80 }),
    );
    render(<Home />);
    expect(await screen.findByText(/você está vivo há/i)).toBeInTheDocument();
  });

  it("quote refresh rotates the meditation quote", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ birthDate: "1990-05-15", lifeExpectancy: 80 }),
    );
    let next = 0;
    vi.spyOn(Math, "random").mockImplementation(() => next);

    const user = userEvent.setup();
    render(<Home />);
    const button = await screen.findByRole("button", { name: /nova meditação/i });
    const firstText = document.querySelector("blockquote p")?.textContent ?? "";

    next = 0.5;
    await user.click(button);
    await waitFor(() => {
      const nowText = document.querySelector("blockquote p")?.textContent ?? "";
      expect(nowText).not.toBe(firstText);
    });
  });

  it("ignores malformed localStorage payload", async () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json{");
    expect(() => render(<Home />)).not.toThrow();
    expect(await screen.findByLabelText(/data de nascimento/i)).toBeInTheDocument();
    expect(screen.getByText(/aguardando início/i)).toBeInTheDocument();
  });
});
