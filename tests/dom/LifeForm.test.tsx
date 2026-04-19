import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LifeForm } from "@/components/LifeForm";

function setup(props: Partial<React.ComponentProps<typeof LifeForm>> = {}) {
  const onBirthDateChange = vi.fn();
  const onLifeExpectancyChange = vi.fn();
  const onSubmit = vi.fn();
  const utils = render(
    <LifeForm
      birthDate=""
      lifeExpectancy={80}
      onBirthDateChange={onBirthDateChange}
      onLifeExpectancyChange={onLifeExpectancyChange}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return { ...utils, onBirthDateChange, onLifeExpectancyChange, onSubmit };
}

describe("LifeForm (Feature E.14)", () => {
  it("submit button is disabled with empty birth date", () => {
    setup();
    const btn = screen.getByRole("button", { name: /calcular/i });
    expect(btn).toBeDisabled();
  });

  it("enables the button when a valid birth date is present", () => {
    setup({ birthDate: "1990-05-15" });
    const btn = screen.getByRole("button", { name: /calcular/i });
    expect(btn).not.toBeDisabled();
  });

  it("keeps the button disabled for an invalid date", () => {
    setup({ birthDate: "not-a-date" });
    const btn = screen.getByRole("button", { name: /calcular/i });
    expect(btn).toBeDisabled();
  });

  it("the date input has min=1900-01-01 and max=today", () => {
    setup({ birthDate: "1990-05-15" });
    const input = screen.getByLabelText(/data de nascimento/i) as HTMLInputElement;
    expect(input.min).toBe("1900-01-01");
    const today = new Date().toISOString().split("T")[0];
    expect(input.max).toBe(today);
  });

  it("invokes onSubmit only when the form is valid", async () => {
    const user = userEvent.setup();
    const { onSubmit, rerender } = setup({ birthDate: "" });
    const btn = screen.getByRole("button", { name: /calcular/i });
    await user.click(btn);
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <LifeForm
        birthDate="1990-05-15"
        lifeExpectancy={80}
        onBirthDateChange={() => {}}
        onLifeExpectancyChange={() => {}}
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: /calcular/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("fires onBirthDateChange on input", () => {
    const { onBirthDateChange } = setup({ birthDate: "1990-05-15" });
    const input = screen.getByLabelText(/data de nascimento/i);
    fireEvent.change(input, { target: { value: "2000-01-01" } });
    expect(onBirthDateChange).toHaveBeenCalledWith("2000-01-01");
  });

  it("uses the provided submitLabel", () => {
    setup({ birthDate: "1990-05-15", submitLabel: "Salvar" });
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });
});
