import { logServerError, logServerInfo } from "@/lib/logger";
import { validateProductionEnv } from "@/lib/env";
import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";

export async function register() {
  validateProductionEnv();
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
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
  const rawRequestId = request.headers["x-request-id"];
  const requestId = Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId;

  logServerError("request.unexpected_error", {
    digest,
    method: request.method,
    requestId,
    route: context.routePath,
    routeType: context.routeType,
  });
  Sentry.captureRequestError(error, request, context);
};
