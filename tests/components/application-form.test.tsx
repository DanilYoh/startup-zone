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
  it("submits investor interest and replaces the form with confirmation", async () => {
    createApplicationMock.mockResolvedValue({
      status: "success",
      message: "Your application was sent to the founder.",
    });
    const user = userEvent.setup();

    render(<ApplicationForm startupId={42} />);

    const message = screen.getByRole("textbox", { name: "Investment interest" });
    await user.type(message, "This company fits my seed thesis and I would like to meet the founder.");
    await user.click(screen.getByRole("button", { name: "Send interest" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your application was sent to the founder.",
    );
    expect(screen.queryByRole("textbox", { name: "Investment interest" })).not.toBeInTheDocument();
    expect(createApplicationMock).toHaveBeenCalledOnce();

    const submitted = createApplicationMock.mock.calls[0]?.[1];
    expect(submitted).toBeInstanceOf(FormData);
    expect(submitted.get("startup_id")).toBe("42");
    expect(submitted.get("message")).toBe(
      "This company fits my seed thesis and I would like to meet the founder.",
    );
  });

  it("explains the information an investor should send", () => {
    render(<ApplicationForm startupId={7} />);

    expect(screen.getByRole("textbox", { name: "Investment interest" })).toHaveAccessibleDescription(
      "Explain the fit with your thesis and the conversation you would like to request.",
    );
    expect(screen.getByRole("button", { name: "Send interest" })).toBeEnabled();
  });
});
