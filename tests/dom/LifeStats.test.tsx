import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LifeStats } from "@/components/LifeStats";
import { LifeBar } from "@/components/LifeBar";
import { Quote } from "@/components/Quote";

const stats = {
  yearsLived: 35,
  yearsRemaining: 45,
  weeksLived: 1820,
  weeksRemaining: 2340,
  daysRemaining: 16425,
  percentLived: 43.75,
  totalWeeks: 4160,
};

describe("LifeStats (Feature E.18)", () => {
  it("renders all four labeled stats with pt-BR formatted numbers", () => {
    render(<LifeStats stats={stats} />);
    expect(screen.getByText("Anos vividos")).toBeInTheDocument();
    expect(screen.getByText("Anos restantes")).toBeInTheDocument();
    expect(screen.getByText("Semanas restantes")).toBeInTheDocument();
    expect(screen.getByText("Dias restantes")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(
      screen.getByText((2340).toLocaleString("pt-BR")),
    ).toBeInTheDocument();
    expect(
      screen.getByText((16425).toLocaleString("pt-BR")),
    ).toBeInTheDocument();
  });
});

describe("LifeBar (Feature E.18)", () => {
  it("shows the percent with one decimal and sets aria-valuenow", () => {
    const { container } = render(<LifeBar percentLived={42.57} />);
    expect(screen.getByText("42.6%")).toBeInTheDocument();
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).not.toBeNull();
    expect(bar!.getAttribute("aria-valuemin")).toBe("0");
    expect(bar!.getAttribute("aria-valuemax")).toBe("100");
    expect(bar!.getAttribute("aria-valuenow")).toBe("43");
  });
});

describe("Quote (Feature E.18)", () => {
  const q = { text: "Tempus fugit.", author: "Virgílio" };

  it("renders quote text and author", () => {
    render(<Quote quote={q} />);
    expect(screen.getByText(/Tempus fugit\./)).toBeInTheDocument();
    expect(screen.getByText(/Virgílio/)).toBeInTheDocument();
  });

  it("invokes onRefresh when the refresh button is clicked", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<Quote quote={q} onRefresh={onRefresh} />);
    await user.click(screen.getByRole("button", { name: /nova citação/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not render a refresh button when onRefresh is omitted", () => {
    render(<Quote quote={q} />);
    expect(
      screen.queryByRole("button", { name: /nova citação/i }),
    ).not.toBeInTheDocument();
  });
});
