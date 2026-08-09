/** @vitest-environment jsdom */

import { LoginForm } from "@/features/auth/components/login-form";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { render, screen, userEvent } from "../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicLegalConfig } from "@/features/legal/types";

const { signInMock, signUpMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
}));

const localLegalConfig: PublicLegalConfig = {
  documentVersion: "local-development-v1",
  effectiveDate: "2026-08-09",
  mode: "draft",
  operatorAddress: "Локальная среда",
  operatorEmail: "privacy@example.test",
  operatorName: "Startup Zone",
  processors: ["Локальная инфраструктура"],
  registrationEnabled: true,
};

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

    render(<SignUpForm legalConfig={localLegalConfig} />);

    await user.type(screen.getByRole("textbox", { name: "Имя и фамилия" }), "Sam Investor");
    await user.type(screen.getByRole("textbox", { name: "Электронная почта" }), "investor@example.test");
    await user.click(screen.getByRole("radio", { name: "Инвестор" }));
    await user.type(screen.getByLabelText(/^Пароль/), "investor-password");
    await user.type(screen.getByLabelText(/^Повторите пароль/), "different-password");
    await user.click(
      screen.getByRole("checkbox", { name: /Я даю отдельное согласие/u }),
    );
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Проверьте выделенные поля и повторите попытку.",
    );
    expect(screen.getByText("Пароли не совпадают")).toBeVisible();
    expect(signUpMock).toHaveBeenCalledOnce();

    const submitted = signUpMock.mock.calls[0]?.[1];
    expect(submitted).toBeInstanceOf(FormData);
    expect(submitted.get("role")).toBe("investor");
    expect(submitted.get("legal_document_version")).toBe("local-development-v1");
    expect(submitted.get("personal_data_consent")).toBe("accepted");
  });

  it("disables registration when production legal configuration is incomplete", () => {
    render(
      <SignUpForm
        legalConfig={{
          ...localLegalConfig,
          documentVersion: "",
          mode: "blocked",
          registrationEnabled: false,
        }}
      />,
    );

    expect(screen.getByText("Регистрация временно закрыта")).toBeVisible();
    expect(screen.getByRole("button", { name: "Создать аккаунт" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /Я даю отдельное согласие/u })).toBeDisabled();
  });
});
