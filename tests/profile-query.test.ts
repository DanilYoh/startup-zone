import { getCurrentProfile } from "@/features/profiles/server/queries";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  contactMaybeSingleMock,
  createClientMock,
  getUserMock,
  logRequestErrorMock,
  profileMaybeSingleMock,
  redirectMock,
} =
  vi.hoisted(() => ({
    contactMaybeSingleMock: vi.fn(),
    createClientMock: vi.fn(),
    getUserMock: vi.fn(),
    logRequestErrorMock: vi.fn(),
    profileMaybeSingleMock: vi.fn(),
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
  profileMaybeSingleMock.mockReset();
  contactMaybeSingleMock.mockReset();
  redirectMock.mockClear();

  const profileQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: profileMaybeSingleMock,
    select: vi.fn().mockReturnThis(),
  };
  const contactQuery = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: contactMaybeSingleMock,
    select: vi.fn().mockReturnThis(),
  };
  createClientMock.mockResolvedValue({
    auth: { getUser: getUserMock },
    from: vi.fn((table: string) => (table === "profiles" ? profileQuery : contactQuery)),
  });
  getUserMock.mockResolvedValue({
    data: { user: { id: "user-1", email: "founder@example.test" } },
  });
  contactMaybeSingleMock.mockResolvedValue({
    data: { contact_email: null, contact_url: null, sharing_enabled: false },
    error: null,
  });
});

describe("getCurrentProfile", () => {
  it("redirects an unauthenticated request before querying profiles", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(getCurrentProfile()).rejects.toThrow("REDIRECT:/auth/login");
    expect(profileMaybeSingleMock).not.toHaveBeenCalled();
    expect(contactMaybeSingleMock).not.toHaveBeenCalled();
  });

  it("returns a ready active-role profile", async () => {
    profileMaybeSingleMock.mockResolvedValue({
      data: { role: "founder", full_name: "Test Founder" },
      error: null,
    });

    const result = await getCurrentProfile();

    expect(result).toMatchObject({
      status: "ready",
      email: "founder@example.test",
      profile: { role: "founder", full_name: "Test Founder" },
      contact: { contact_email: null, contact_url: null, sharing_enabled: false },
    });
  });

  it("distinguishes missing and retired profiles", async () => {
    profileMaybeSingleMock
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { role: "specialist" }, error: null });

    await expect(getCurrentProfile()).resolves.toMatchObject({ status: "missing" });
    await expect(getCurrentProfile()).resolves.toMatchObject({ status: "retired" });
  });

  it("logs a safe database code and returns an explicit error state", async () => {
    profileMaybeSingleMock.mockResolvedValue({
      data: null,
      error: { code: "PGRST500" },
    });

    await expect(getCurrentProfile()).resolves.toEqual({
      status: "error",
      email: "founder@example.test",
    });
    expect(logRequestErrorMock).toHaveBeenCalledWith("profile.read_failed", {
      profileCode: "PGRST500",
      contactCode: undefined,
    });
  });
});
