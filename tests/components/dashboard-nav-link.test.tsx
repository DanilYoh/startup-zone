/** @vitest-environment jsdom */

import { DashboardNavLink } from "@/components/dashboard-nav-link";
import { render, screen } from "../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
}));

beforeEach(() => {
  pathnameMock.mockReset();
});

describe("DashboardNavLink", () => {
  it("marks a matching nested route as current", () => {
    pathnameMock.mockReturnValue("/dashboard/profile/contact");

    render(
      <DashboardNavLink
        href="/dashboard/profile"
        className="nav"
        activeClassName="active"
      >
        Профиль
      </DashboardNavLink>,
    );

    const link = screen.getByRole("link", { name: "Профиль" });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveClass("nav", "active");
  });

  it("keeps the dashboard overview exact", () => {
    pathnameMock.mockReturnValue("/dashboard/profile");

    render(
      <DashboardNavLink
        href="/dashboard"
        exact
        className="nav"
        activeClassName="active"
      >
        Обзор
      </DashboardNavLink>,
    );

    expect(screen.getByRole("link", { name: "Обзор" })).not.toHaveAttribute("aria-current");
  });
});
