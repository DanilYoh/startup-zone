import { onRequestError, register } from "@/instrumentation";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  captureRequestErrorMock,
  logServerErrorMock,
  logServerInfoMock,
  validateProductionEnvMock,
} = vi.hoisted(() => ({
  captureRequestErrorMock: vi.fn(),
  logServerErrorMock: vi.fn(),
  logServerInfoMock: vi.fn(),
  validateProductionEnvMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ validateProductionEnv: validateProductionEnvMock }));
vi.mock("@/lib/logger", () => ({
  logServerError: logServerErrorMock,
  logServerInfo: logServerInfoMock,
}));
vi.mock("@sentry/nextjs", () => ({ captureRequestError: captureRequestErrorMock }));

beforeEach(() => {
  vi.stubEnv("NEXT_RUNTIME", "test");
  captureRequestErrorMock.mockReset();
  logServerErrorMock.mockReset();
  logServerInfoMock.mockReset();
  validateProductionEnvMock.mockReset();
});

describe("Next.js instrumentation", () => {
  it("validates the runtime before reporting startup", async () => {
    await register();
    expect(validateProductionEnvMock).toHaveBeenCalledOnce();
    expect(logServerInfoMock).toHaveBeenCalledWith("server.started", {
      runtime: "test",
    });
  });

  it("records sanitized unexpected request context in logs and error tracking", () => {
    const error = Object.assign(new Error("private failure"), { digest: "safe-digest" });
    const request = {
      path: "/dashboard",
      method: "POST",
      headers: { "x-request-id": ["request-123", "ignored"] },
    };
    const context = {
      routerKind: "App Router" as const,
      routePath: "/dashboard",
      routeType: "action" as const,
      revalidateReason: undefined,
    };

    onRequestError(error, request, context);

    expect(logServerErrorMock).toHaveBeenCalledWith("request.unexpected_error", {
      digest: "safe-digest",
      method: "POST",
      requestId: "request-123",
      route: "/dashboard",
      routeType: "action",
    });
    expect(captureRequestErrorMock).toHaveBeenCalledWith(error, request, context);
  });
});
