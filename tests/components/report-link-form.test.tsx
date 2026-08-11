/** @vitest-environment jsdom */

import { ReportLinkForm } from "@/features/startups/components/report-link-form";
import { render, screen, userEvent } from "../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { reportStartupLinkMock } = vi.hoisted(() => ({
  reportStartupLinkMock: vi.fn(),
}));

vi.mock("@/features/startups/server/report-actions", () => ({
  reportStartupLink: reportStartupLinkMock,
}));

beforeEach(() => {
  reportStartupLinkMock.mockReset().mockResolvedValue({
    status: "success",
    message: "Жалоба отправлена на проверку.",
  });
});

describe("ReportLinkForm", () => {
  it("submits the displayed link kind and a controlled reason", async () => {
    const user = userEvent.setup();
    render(<ReportLinkForm startupId={42} linkKind="deck" />);

    await user.click(screen.getByText("Сообщить о ссылке"));
    await user.selectOptions(screen.getByRole("combobox", { name: "Причина жалобы" }), "malware");
    await user.click(screen.getByRole("button", { name: "Отправить жалобу" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Жалоба отправлена на проверку.",
    );
    const submitted = reportStartupLinkMock.mock.calls[0]?.[1] as FormData;
    expect(submitted.get("startup_id")).toBe("42");
    expect(submitted.get("link_kind")).toBe("deck");
    expect(submitted.get("reason")).toBe("malware");
  });
});
