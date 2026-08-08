type LogValue = string | number | boolean | null | undefined;
type LogContext = Readonly<Record<string, LogValue>>;

function write(level: "info" | "error", event: string, context: LogContext = {}) {
  const entry = {
    timestamp: new Date(performance.timeOrigin + performance.now()).toISOString(),
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
