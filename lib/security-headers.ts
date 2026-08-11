type Environment = Readonly<Record<string, string | undefined>>;

function connectionSource(value: string | undefined) {
  if (!value) return [];

  try {
    const url = new URL(value);
    const sources = [url.origin];
    if (url.protocol === "https:") sources.push(`wss://${url.host}`);
    if (url.protocol === "http:") sources.push(`ws://${url.host}`);
    return sources;
  } catch {
    return [];
  }
}

export function createContentSecurityPolicy(
  nonce: string,
  environment: Environment = process.env,
) {
  const connectSources = new Set([
    "'self'",
    ...connectionSource(environment.NEXT_PUBLIC_SUPABASE_URL),
    ...connectionSource(environment.NEXT_PUBLIC_SENTRY_DSN),
  ]);
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src ${[...connectSources].join(" ")}`,
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https:",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${environment.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    // Mantine uses inline CSS custom properties for component variants. Keep
    // that compatibility exception separate from executable/style elements.
    "style-src-attr 'unsafe-inline'",
  ];

  if (environment.APP_ENVIRONMENT === "production") {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
