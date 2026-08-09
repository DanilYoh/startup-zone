import { headers } from "next/headers";

type LogValue = string | number | boolean | null | undefined;
type LogContext = Readonly<Record<string, LogValue>>;

function write(level: "info" | "error", event: string, context: LogContext = {}) {
  const entry = {
    timestamp: new Date(performance.timeOrigin + performance.now()).toISOString(),
    eventId: crypto.randomUUID(),
    service: "startup-zone-web",
    environment: process.env.APP_ENVIRONMENT ?? process.env.NODE_ENV ?? "unknown",
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.RELEASE_VERSION ?? "unknown",
    level,
    event,
    ...Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined)),
  };

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else console.info(line);
}

export function logServerInfo(event: string, context?: LogContext) {
  write("info", event, context);
}

export function logServerError(event: string, context?: LogContext) {
  write("error", event, context);
}

export async function logRequestError(event: string, context?: LogContext) {
  let requestId: string | undefined;

  try {
    requestId = (await headers()).get("x-request-id") ?? undefined;
  } catch {
    // Startup hooks and background contexts do not always have request headers.
  }

  write("error", event, { requestId, ...context });
}
