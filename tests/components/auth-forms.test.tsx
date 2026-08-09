/** @vitest-environment jsdom */

import { LoginForm } from "@/features/auth/components/login-form";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { render, screen, userEvent } from "../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInMock, signUpMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
}));

vi.mock("@/features/auth/server/actions", () => ({
  signIn: signInMock,
  signUp: signUpMock,
}));

beforeEach(() => {
  signInMock.mockReset();
  signUpMock.mockReset();
});

describe("authentication forms", () => {
  it("submits credentials and presents a stable sign-in error", async () => {
    signInMock.mockResolvedValue({
      status: "error",
      message: "Неверная электронная почта или пароль.",
    });
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByRole("textbox", { name: "Электронная почта" }), "founder@example.test");
    await user.type(screen.getByLabelText(/^Пароль/), "correct-horse-battery-staple");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Неверная электронная почта или пароль.",
    );
    expect(signInMock).toHaveBeenCalledOnce();

    const submitted = signInMock.mock.calls[0]?.[1];
    expect(submitted).toBeInstanceOf(FormData);
    expect(submitted.get("email")).toBe("founder@example.test");
    expect(submitted.get("password")).toBe("correct-horse-battery-staple");
  });

  it("submits the selected marketplace role and exposes field errors", async () => {
    signUpMock.mockResolvedValue({
      status: "error",
      message: "Проверьте выделенные поля и повторите попытку.",
      errors: { repeat_password: ["Пароли не совпадают"] },
    });
    const user = userEvent.setup();

    render(<SignUpForm />);

    await user.type(screen.getByRole("textbox", { name: "Имя и фамилия" }), "Sam Investor");
    await user.type(screen.getByRole("textbox", { name: "Электронная почта" }), "investor@example.test");
    await user.click(screen.getByRole("radio", { name: "Инвестор" }));
    await user.type(screen.getByLabelText(/^Пароль/), "investor-password");
    await user.type(screen.getByLabelText(/^Повторите пароль/), "different-password");
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Проверьте выделенные поля и повторите попытку.",
    );
    expect(screen.getByText("Пароли не совпадают")).toBeVisible();
    expect(signUpMock).toHaveBeenCalledOnce();

    const submitted = signUpMock.mock.calls[0]?.[1];
    expect(submitted).toBeInstanceOf(FormData);
    expect(submitted.get("role")).toBe("investor");
  });
});
