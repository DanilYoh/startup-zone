/** @vitest-environment jsdom */

import { render, screen } from "../test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/utils", () => ({ hasEnvVars: false }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { AuthButton } from "@/components/auth-button";

describe("AuthButton", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("renders a safe local fallback without creating a Supabase client", async () => {
    render(await AuthButton());

    expect(screen.getByText("Деморежим")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Войти" })).toBeDisabled();
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
