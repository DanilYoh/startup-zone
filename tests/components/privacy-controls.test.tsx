/** @vitest-environment jsdom */

import { PrivacyControls } from "@/features/account/components/privacy-controls";
import { render, screen, userEvent } from "../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteAccountMock } = vi.hoisted(() => ({ deleteAccountMock: vi.fn() }));

vi.mock("@/features/account/server/actions", () => ({
  deleteAccount: deleteAccountMock,
}));

beforeEach(() => {
  deleteAccountMock.mockReset().mockResolvedValue({
    status: "error",
    message: "Текущий пароль не подтверждён.",
  });
});

describe("PrivacyControls", () => {
  it("offers an export and requires explicit deletion inputs", async () => {
    const user = userEvent.setup();
    render(<PrivacyControls />);

    expect(screen.getByRole("link", { name: "Скачать мои данные" })).toHaveAttribute(
      "href",
      "/dashboard/account/export",
    );

    const passwordInput = document.querySelector<HTMLInputElement>(
      'input[name="current_password"]',
    );
    expect(passwordInput).not.toBeNull();
    await user.type(passwordInput!, "password-value");
    await user.type(
      screen.getByRole("textbox", { name: "Введите УДАЛИТЬ для подтверждения" }),
      "УДАЛИТЬ",
    );
    await user.click(
      screen.getByRole("button", { name: "Отозвать согласие и удалить аккаунт" }),
    );

    expect(await screen.findByText("Текущий пароль не подтверждён.")).toBeVisible();
    const submitted = deleteAccountMock.mock.calls[0]?.[1] as FormData;
    expect(submitted.get("current_password")).toBe("password-value");
    expect(submitted.get("confirmation")).toBe("УДАЛИТЬ");
  });
});
