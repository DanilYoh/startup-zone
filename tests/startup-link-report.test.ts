import {
  reportStartupLink,
  type LinkReportActionState,
} from "@/features/startups/server/report-actions";
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

const initialState: LinkReportActionState = { status: "idle" };

function reportForm() {
  const formData = new FormData();
  formData.set("startup_id", "42");
  formData.set("link_kind", "website");
  formData.set("reason", "phishing");
  return formData;
}

beforeEach(() => {
  getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "reporter-id" } } });
  rpcMock.mockReset().mockResolvedValue({ data: true, error: null });
  logRequestErrorMock.mockReset();
  createClientMock.mockReset().mockResolvedValue({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
  });
});

describe("startup link reporting", () => {
  it("rejects malformed reports before creating a Supabase client", async () => {
    const state = await reportStartupLink(initialState, new FormData());

    expect(state.status).toBe("error");
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("requires an authenticated reporter", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(reportStartupLink(initialState, reportForm())).resolves.toEqual({
      status: "error",
      message: "Войдите в аккаунт, чтобы отправить жалобу.",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("submits only the persisted startup and controlled reason fields", async () => {
    await expect(reportStartupLink(initialState, reportForm())).resolves.toEqual({
      status: "success",
      message: "Жалоба отправлена на проверку.",
    });
    expect(rpcMock).toHaveBeenCalledWith("report_startup_link", {
      reported_link_kind: "website",
      reported_reason: "phishing",
      reported_startup_id: 42,
    });
  });

  it("returns a stable error and logs only the database code", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { code: "P0001" } });

    const state = await reportStartupLink(initialState, reportForm());

    expect(state.message).toBe("Не удалось отправить жалобу. Повторите позже.");
    expect(logRequestErrorMock).toHaveBeenCalledWith("startup.link_report_failed", {
      code: "P0001",
    });
  });
});
