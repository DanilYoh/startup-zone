/** @vitest-environment jsdom */

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { UpdatePasswordForm } from "@/components/update-password-form";
import { fireEvent, render, screen, userEvent } from "../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, resetPasswordForEmailMock, updateUserMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  resetPasswordForEmailMock: vi.fn(),
  updateUserMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: resetPasswordForEmailMock,
      updateUser: updateUserMock,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  pushMock.mockReset();
  resetPasswordForEmailMock.mockReset();
  updateUserMock.mockReset();
});

describe("password recovery forms", () => {
  it("replaces raw reset-request errors with a stable safe message", async () => {
    resetPasswordForEmailMock.mockResolvedValue({
      error: new Error("Raw Auth user lookup details"),
    });
    const user = userEvent.setup();

    render(<ForgotPasswordForm />);
    await user.type(screen.getByRole("textbox", { name: "Электронная почта" }), "user@example.test");
    await user.click(screen.getByRole("button", { name: "Отправить ссылку" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось отправить инструкцию по восстановлению. Повторите попытку позже.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("Raw Auth user lookup details");
  });

  it("validates a new password with the shared schema before calling Auth", async () => {
    const user = userEvent.setup();

    render(<UpdatePasswordForm />);
    await user.type(screen.getByLabelText(/^Новый пароль/), "Abc123");
    const form = screen.getByRole("button", { name: "Сохранить пароль" }).closest("form");
    if (!form) throw new Error("Update password form was not rendered");
    fireEvent.submit(form);

    expect(await screen.findByRole("alert")).toHaveTextContent("Используйте не менее 8 символов");
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("replaces raw password-update errors with a stable safe message", async () => {
    updateUserMock.mockResolvedValue({
      error: new Error("Raw Auth recovery session details"),
    });
    const user = userEvent.setup();

    render(<UpdatePasswordForm />);
    await user.type(screen.getByLabelText(/^Новый пароль/), "Abcd1234");
    await user.click(screen.getByRole("button", { name: "Сохранить пароль" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось обновить пароль. Запросите новую ссылку для восстановления.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(
      "Raw Auth recovery session details",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
