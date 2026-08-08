import { afterEach, describe, expect, it, vi } from "vitest";
import { logServerError, logServerInfo } from "../lib/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("server logger", () => {
  it("writes structured informational events", () => {
    const output = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logServerInfo("server.started", { runtime: "nodejs", ignored: undefined });

    expect(output).toHaveBeenCalledOnce();
    expect(JSON.parse(String(output.mock.calls[0][0]))).toMatchObject({
      level: "info",
      event: "server.started",
      runtime: "nodejs",
    });
    expect(String(output.mock.calls[0][0])).not.toContain("ignored");
  });

  it("sends structured failures to the error stream", () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logServerError("application.create_failed", { code: "P0001" });

    expect(output).toHaveBeenCalledOnce();
    expect(JSON.parse(String(output.mock.calls[0][0]))).toMatchObject({
      level: "error",
      event: "application.create_failed",
      code: "P0001",
    });
  });
});
