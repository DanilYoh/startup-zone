import { afterEach, describe, expect, it, vi } from "vitest";
import { logRequestError, logServerError, logServerInfo } from "../lib/logger";

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
      service: "startup-zone-web",
      runtime: "nodejs",
    });
    expect(JSON.parse(String(output.mock.calls[0][0])).eventId).toMatch(
      /^[0-9a-f-]{36}$/,
    );
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

  it("still writes request errors outside a request context", async () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await logRequestError("background.failed", { code: "08006" });

    expect(JSON.parse(String(output.mock.calls[0][0]))).toMatchObject({
      level: "error",
      event: "background.failed",
      code: "08006",
    });
  });
});
