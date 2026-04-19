import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { WeeksGrid } from "@/components/WeeksGrid";

describe("WeeksGrid (Feature E.17)", () => {
  it("renders exactly totalWeeks cells", () => {
    const totalWeeks = 100;
    const { container } = render(
      <WeeksGrid weeksLived={0} totalWeeks={totalWeeks} />,
    );
    const cells = container.querySelectorAll('div[class*="aspect-square"]');
    expect(cells).toHaveLength(totalWeeks);
  });

  it("first weeksLived cells are filled, the rest are bordered", () => {
    const { container } = render(
      <WeeksGrid weeksLived={40} totalWeeks={100} />,
    );
    const cells = Array.from(
      container.querySelectorAll('div[class*="aspect-square"]'),
    ) as HTMLElement[];
    const filled = cells.filter((c) => c.className.includes("bg-neutral-900"));
    const bordered = cells.filter((c) => c.className.includes("border"));
    expect(filled).toHaveLength(40);
    expect(bordered).toHaveLength(60);
  });

  it("renders zero cells for totalWeeks=0 without crashing", () => {
    const { container } = render(<WeeksGrid weeksLived={0} totalWeeks={0} />);
    const cells = container.querySelectorAll('div[class*="aspect-square"]');
    expect(cells).toHaveLength(0);
  });

  it("renders the heading and footer copy", () => {
    const { getByText } = render(
      <WeeksGrid weeksLived={10} totalWeeks={100} />,
    );
    expect(getByText(/sua vida em semanas/i)).toBeInTheDocument();
    expect(
      getByText("cada quadrado é uma semana da sua vida"),
    ).toBeInTheDocument();
    expect(getByText("10 / 100")).toBeInTheDocument();
  });
});
