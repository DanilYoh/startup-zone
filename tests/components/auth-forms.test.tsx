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
      message: "Email or password is incorrect.",
    });
    const user = userEvent.setup();

    render(<LoginForm />);

    await user.type(screen.getByRole("textbox", { name: "Email" }), "founder@example.test");
    await user.type(screen.getByLabelText(/^Password/), "correct-horse-battery-staple");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is incorrect.",
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
      message: "Review the highlighted fields and try again.",
      errors: { repeat_password: ["Passwords do not match"] },
    });
    const user = userEvent.setup();

    render(<SignUpForm />);

    await user.type(screen.getByRole("textbox", { name: "Full name" }), "Sam Specialist");
    await user.type(screen.getByRole("textbox", { name: "Email" }), "specialist@example.test");
    await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "specialist");
    await user.type(screen.getByLabelText(/^Password/), "specialist-password");
    await user.type(screen.getByLabelText(/^Repeat password/), "different-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Review the highlighted fields and try again.",
    );
    expect(screen.getByText("Passwords do not match")).toBeVisible();
    expect(signUpMock).toHaveBeenCalledOnce();

    const submitted = signUpMock.mock.calls[0]?.[1];
    expect(submitted).toBeInstanceOf(FormData);
    expect(submitted.get("role")).toBe("specialist");
  });
});
