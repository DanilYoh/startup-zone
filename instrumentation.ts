import { logServerError, logServerInfo } from "@/lib/logger";
import type { Instrumentation } from "next";

export function register() {
  logServerInfo("server.started", { runtime: process.env.NEXT_RUNTIME ?? "unknown" });
}

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  logServerError("request.unexpected_error", {
    digest,
    method: request.method,
    route: context.routePath,
    routeType: context.routeType,
  });
};
