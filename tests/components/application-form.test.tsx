/** @vitest-environment jsdom */

import { ApplicationForm } from "@/features/applications/components/application-form";
import { render, screen, userEvent } from "../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createApplicationMock } = vi.hoisted(() => ({
  createApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/server/actions", () => ({
  createApplication: createApplicationMock,
}));

beforeEach(() => {
  createApplicationMock.mockReset();
});

describe("ApplicationForm", () => {
  it("submits a specialist application and replaces the form with confirmation", async () => {
    createApplicationMock.mockResolvedValue({
      status: "success",
      message: "Your application was sent to the founder.",
    });
    const user = userEvent.setup();

    render(<ApplicationForm startupId={42} role="specialist" />);

    const message = screen.getByRole("textbox", { name: "Message to the founder" });
    await user.type(message, "I can help the team ship its first production release.");
    await user.click(screen.getByRole("button", { name: "Send application" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your application was sent to the founder.",
    );
    expect(screen.queryByRole("textbox", { name: "Message to the founder" })).not.toBeInTheDocument();
    expect(createApplicationMock).toHaveBeenCalledOnce();

    const submitted = createApplicationMock.mock.calls[0]?.[1];
    expect(submitted).toBeInstanceOf(FormData);
    expect(submitted.get("startup_id")).toBe("42");
    expect(submitted.get("message")).toBe(
      "I can help the team ship its first production release.",
    );
  });

  it("uses investor-specific labels and actions", () => {
    render(<ApplicationForm startupId={7} role="investor" />);

    expect(screen.getByRole("textbox", { name: "Investment interest" })).toHaveAccessibleDescription(
      "Describe your interest and the contact you would like to request.",
    );
    expect(screen.getByRole("button", { name: "Send interest" })).toBeEnabled();
  });
});
