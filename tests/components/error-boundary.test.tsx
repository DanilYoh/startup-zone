/** @vitest-environment jsdom */

import AppError from "@/app/error";
import { render, screen, userEvent } from "../test-utils";
import { describe, expect, it, vi } from "vitest";

describe("AppError", () => {
  it("keeps internal failures private and lets the user retry", async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    const error = Object.assign(new Error("private database failure"), {
      digest: "safe-digest",
    });

    render(<AppError error={error} reset={reset} />);

    expect(screen.getByRole("heading", { name: "Что-то пошло не так" })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Не удалось загрузить страницу");
    expect(screen.queryByText("private database failure")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Повторить" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
