import { getCurrentProfile } from "@/features/profiles/server/queries";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, getUserMock, logRequestErrorMock, maybeSingleMock, redirectMock } =
  vi.hoisted(() => ({
    createClientMock: vi.fn(),
    getUserMock: vi.fn(),
    logRequestErrorMock: vi.fn(),
    maybeSingleMock: vi.fn(),
    redirectMock: vi.fn((pathname: string): never => {
      throw new Error(`REDIRECT:${pathname}`);
    }),
  }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/logger", () => ({ logRequestError: logRequestErrorMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

beforeEach(() => {
  createClientMock.mockReset();
  getUserMock.mockReset();
  logRequestErrorMock.mockReset();
  maybeSingleMock.mockReset();
  redirectMock.mockClear();

  const query = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: maybeSingleMock,
    select: vi.fn().mockReturnThis(),
  };
  createClientMock.mockResolvedValue({
    auth: { getUser: getUserMock },
    from: vi.fn(() => query),
  });
  getUserMock.mockResolvedValue({
    data: { user: { id: "user-1", email: "founder@example.test" } },
  });
});

describe("getCurrentProfile", () => {
  it("redirects an unauthenticated request before querying profiles", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(getCurrentProfile()).rejects.toThrow("REDIRECT:/auth/login");
    expect(maybeSingleMock).not.toHaveBeenCalled();
  });

  it("returns a ready active-role profile", async () => {
    maybeSingleMock.mockResolvedValue({
      data: { role: "founder", full_name: "Test Founder" },
      error: null,
    });

    const result = await getCurrentProfile();

    expect(result).toMatchObject({
      status: "ready",
      email: "founder@example.test",
      profile: { role: "founder", full_name: "Test Founder" },
    });
  });

  it("distinguishes missing and retired profiles", async () => {
    maybeSingleMock
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { role: "specialist" }, error: null });

    await expect(getCurrentProfile()).resolves.toMatchObject({ status: "missing" });
    await expect(getCurrentProfile()).resolves.toMatchObject({ status: "retired" });
  });

  it("logs a safe database code and returns an explicit error state", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { code: "PGRST500" } });

    await expect(getCurrentProfile()).resolves.toEqual({
      status: "error",
      email: "founder@example.test",
    });
    expect(logRequestErrorMock).toHaveBeenCalledWith("profile.read_failed", {
      code: "PGRST500",
    });
  });
});
