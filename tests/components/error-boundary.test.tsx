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

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("This page could not be loaded");
    expect(screen.queryByText("private database failure")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
