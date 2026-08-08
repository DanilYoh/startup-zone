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
    await user.type(screen.getByRole("textbox", { name: "Email" }), "user@example.test");
    await user.click(screen.getByRole("button", { name: "Send reset email" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not send reset instructions. Please try again later.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("Raw Auth user lookup details");
  });

  it("validates a new password with the shared schema before calling Auth", async () => {
    const user = userEvent.setup();

    render(<UpdatePasswordForm />);
    await user.type(screen.getByLabelText(/^New password/), "Abc123");
    const form = screen.getByRole("button", { name: "Save new password" }).closest("form");
    if (!form) throw new Error("Update password form was not rendered");
    fireEvent.submit(form);

    expect(await screen.findByRole("alert")).toHaveTextContent("Use at least 8 characters");
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("replaces raw password-update errors with a stable safe message", async () => {
    updateUserMock.mockResolvedValue({
      error: new Error("Raw Auth recovery session details"),
    });
    const user = userEvent.setup();

    render(<UpdatePasswordForm />);
    await user.type(screen.getByLabelText(/^New password/), "Abcd1234");
    await user.click(screen.getByRole("button", { name: "Save new password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not update your password. Request a new reset link and try again.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(
      "Raw Auth recovery session details",
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
