/** @vitest-environment jsdom */

import { LogoutButton } from "@/components/logout-button";
import { render, screen, userEvent, waitFor } from "../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { refreshMock, replaceMock, signOutMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  replaceMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: signOutMock } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, replace: replaceMock }),
}));

beforeEach(() => {
  refreshMock.mockReset();
  replaceMock.mockReset();
  signOutMock.mockReset();
});

describe("LogoutButton", () => {
  it("navigates only after Supabase confirms sign-out", async () => {
    signOutMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    render(<LogoutButton />);
    await user.click(screen.getByRole("button", { name: "Выйти" }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/auth/login"));
    expect(refreshMock).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the user in place and shows a safe message for an Auth error", async () => {
    signOutMock.mockResolvedValue({ error: new Error("Raw Supabase network details") });
    const user = userEvent.setup();

    render(<LogoutButton />);
    await user.click(screen.getByRole("button", { name: "Выйти" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось выйти. Проверьте соединение и повторите попытку.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent("Raw Supabase network details");
    expect(replaceMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("handles a thrown network failure without navigating", async () => {
    signOutMock.mockRejectedValue(new Error("Connection failed"));
    const user = userEvent.setup();

    render(<LogoutButton />);
    await user.click(screen.getByRole("button", { name: "Выйти" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не удалось выйти. Проверьте соединение и повторите попытку.",
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
