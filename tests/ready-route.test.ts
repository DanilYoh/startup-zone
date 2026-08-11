import { GET, resetReadinessCacheForTests } from "@/app/readyz/route";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  abortSignalMock,
  createClientMock,
  fromMock,
  limitMock,
  logServerErrorMock,
  logServerInfoMock,
  selectMock,
} = vi.hoisted(() => ({
  abortSignalMock: vi.fn(),
  createClientMock: vi.fn(),
  fromMock: vi.fn(),
  limitMock: vi.fn(),
  logServerErrorMock: vi.fn(),
  logServerInfoMock: vi.fn(),
  selectMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getSupabaseEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  }),
}));
vi.mock("@/lib/logger", () => ({
  logServerError: logServerErrorMock,
  logServerInfo: logServerInfoMock,
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

beforeEach(() => {
  resetReadinessCacheForTests();
  abortSignalMock.mockReset().mockResolvedValue({ data: [], error: null });
  limitMock.mockReset().mockReturnValue({ abortSignal: abortSignalMock });
  selectMock.mockReset().mockReturnValue({ limit: limitMock });
  fromMock.mockReset().mockReturnValue({ select: selectMock });
  createClientMock.mockReset().mockReturnValue({ from: fromMock });
  logServerErrorMock.mockReset();
  logServerInfoMock.mockReset();
});

describe("readiness route", () => {
  it("runs a bounded public database query and returns only general status", async () => {
    const response = await GET(
      new Request("https://startup-zone.example/readyz", {
        headers: { "x-request-id": "edge-request-123" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-request-id")).toBe("edge-request-123");
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(fromMock).toHaveBeenCalledWith("startups");
    expect(selectMock).toHaveBeenCalledWith("id");
    expect(limitMock).toHaveBeenCalledWith(1);
    expect(createClientMock.mock.calls[0]?.[2]).toMatchObject({
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { "x-request-id": "edge-request-123" } },
    });
    expect(logServerInfoMock).toHaveBeenCalledWith("readiness.succeeded", {
      cache: "miss",
      requestId: "edge-request-123",
    });
  });

  it("reuses a recent probe instead of spending database quota per request", async () => {
    const first = await GET(new Request("https://startup-zone.example/readyz"));
    const second = await GET(new Request("https://startup-zone.example/readyz"));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(createClientMock).toHaveBeenCalledOnce();
    expect(logServerInfoMock).toHaveBeenLastCalledWith("readiness.succeeded", {
      cache: "hit",
      requestId: expect.any(String),
    });
  });

  it("returns 503 without leaking database details", async () => {
    abortSignalMock.mockResolvedValue({
      data: null,
      error: { code: "08006", message: "private database host" },
    });

    const response = await GET(
      new Request("https://startup-zone.example/readyz", {
        headers: { "x-request-id": "edge-request-456" },
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.text()).toBe('{"status":"unavailable"}');
    expect(logServerErrorMock).toHaveBeenCalledWith("readiness.failed", {
      cache: "miss",
      code: "08006",
      requestId: "edge-request-456",
    });
  });
});
