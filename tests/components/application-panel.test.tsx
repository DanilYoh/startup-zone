/** @vitest-environment jsdom */

import { ApplicationPanel } from "@/features/applications/components/application-panel";
import { render, screen } from "../test-utils";
import { beforeEach, expect, it, vi } from "vitest";

const { getApplicationContextMock } = vi.hoisted(() => ({
  getApplicationContextMock: vi.fn(),
}));

vi.mock("@/features/applications/server/queries", () => ({
  getApplicationContext: getApplicationContextMock,
}));

beforeEach(() => {
  getApplicationContextMock.mockReset();
});

it("preserves the selected startup when a signed-out investor opens login", async () => {
  getApplicationContextMock.mockResolvedValue({ status: "signed_out" });

  render(
    await ApplicationPanel({
      startupId: 42,
      founderId: "founder-id",
      startupSlug: "climate-lens",
    }),
  );

  expect(screen.getByRole("link", { name: "Войти и откликнуться" })).toHaveAttribute(
    "href",
    "/auth/login?next=%2Fstartups%2Fclimate-lens",
  );
});
