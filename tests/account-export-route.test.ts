import { GET } from "@/app/dashboard/account/export/route";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, getUserMock, logRequestErrorMock, rpcMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getUserMock: vi.fn(),
  logRequestErrorMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/logger", () => ({ logRequestError: logRequestErrorMock }));

beforeEach(() => {
  getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "account-id" } } });
  rpcMock.mockReset().mockResolvedValue({
    data: { schema_version: 1, account: { email: "person@example.test" } },
    error: null,
  });
  logRequestErrorMock.mockReset();
  createClientMock.mockReset().mockResolvedValue({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
  });
});

describe("account export route", () => {
  it("rejects an unauthenticated export", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("downloads a no-store JSON export from the scoped database function", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain(
      'filename="startup-zone-data.json"',
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.json()).resolves.toMatchObject({ schema_version: 1 });
    expect(rpcMock).toHaveBeenCalledWith("export_my_personal_data");
  });

  it("does not expose database export errors", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: "42501" } });

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "unavailable" });
    expect(logRequestErrorMock).toHaveBeenCalledWith("account.export_failed", {
      code: "42501",
    });
  });
});
