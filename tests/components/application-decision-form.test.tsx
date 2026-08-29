/** @vitest-environment jsdom */

import { ApplicationDecisionForm } from "@/features/applications/components/application-decision-form";
import { render, screen, userEvent } from "../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { moderateApplicationMock } = vi.hoisted(() => ({
  moderateApplicationMock: vi.fn(),
}));

vi.mock("@/features/applications/server/actions", () => ({
  moderateApplication: moderateApplicationMock,
}));

beforeEach(() => {
  moderateApplicationMock.mockReset();
  moderateApplicationMock.mockResolvedValue({
    status: "success",
    message: "Решение сохранено.",
  });
});

describe("ApplicationDecisionForm", () => {
  it.each([
    {
      decision: "accepted",
      firstLabel: "Принять",
      confirmationLabel: "Да, принять заявку",
    },
    {
      decision: "rejected",
      firstLabel: "Отклонить",
      confirmationLabel: "Да, отклонить заявку",
    },
  ])(
    "requires explicit confirmation before submitting $decision",
    async ({ confirmationLabel, decision, firstLabel }) => {
      const user = userEvent.setup();
      render(<ApplicationDecisionForm applicationId={73} />);

      await user.click(screen.getByRole("button", { name: firstLabel }));

      expect(moderateApplicationMock).not.toHaveBeenCalled();
      expect(screen.getByText(/После подтверждения решение нельзя изменить/u)).toBeVisible();

      await user.click(screen.getByRole("button", { name: "Отмена" }));

      expect(moderateApplicationMock).not.toHaveBeenCalled();
      expect(screen.queryByText(/После подтверждения решение нельзя изменить/u)).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: firstLabel }));
      await user.click(screen.getByRole("button", { name: confirmationLabel }));

      expect(moderateApplicationMock).toHaveBeenCalledOnce();
      const submitted = moderateApplicationMock.mock.calls[0]?.[1];
      expect(submitted).toBeInstanceOf(FormData);
      expect(submitted.get("application_id")).toBe("73");
      expect(submitted.get("decision")).toBe(decision);
    },
  );
});
