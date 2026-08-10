import { updateSession } from "@/lib/supabase/proxy";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerClientMock, environmentState, getClaimsMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  environmentState: { configured: false },
  getClaimsMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createServerClient: createServerClientMock }));
vi.mock("@/lib/env", () => ({
  getSupabaseEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  }),
}));
vi.mock("@/lib/utils", () => ({
  get hasEnvVars() {
    return environmentState.configured;
  },
}));

beforeEach(() => {
  environmentState.configured = false;
  getClaimsMock.mockReset();
  createServerClientMock.mockReset().mockReturnValue({
    auth: { getClaims: getClaimsMock },
  });
});

describe("Supabase request proxy", () => {
  it("keeps public pages available when Supabase is intentionally unconfigured", async () => {
    const response = await updateSession(
      new NextRequest("https://startup-zone.example/startups", {
        headers: { "x-request-id": "request-public" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("request-public");
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("keeps protected pages closed when Supabase is unconfigured", async () => {
    const response = await updateSession(
      new NextRequest("https://startup-zone.example/dashboard/private?unsafe=true"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://startup-zone.example/");
    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/u);
  });

  it("forwards authenticated requests and propagates request id to Supabase", async () => {
    environmentState.configured = true;
    getClaimsMock.mockResolvedValue({ data: { claims: { sub: "user-id" } } });

    const response = await updateSession(
      new NextRequest("https://startup-zone.example/dashboard", {
        headers: { "x-request-id": "request-authenticated" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("request-authenticated");
    expect(createServerClientMock.mock.calls[0]?.[2]).toMatchObject({
      global: { headers: { "x-request-id": "request-authenticated" } },
    });
  });

  it("redirects an unauthenticated protected request to login", async () => {
    environmentState.configured = true;
    getClaimsMock.mockResolvedValue({ data: { claims: null } });

    const response = await updateSession(
      new NextRequest("https://startup-zone.example/dashboard/profile", {
        headers: { "x-request-id": "request-anonymous" },
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://startup-zone.example/auth/login",
    );
    expect(response.headers.get("x-request-id")).toBe("request-anonymous");
  });
});
