import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

const connectSources = new Set([
  "'self'",
  ...connectionSource(process.env.NEXT_PUBLIC_SUPABASE_URL),
  ...connectionSource(process.env.NEXT_PUBLIC_SENTRY_DSN),
]);

const contentSecurityPolicyDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  `connect-src ${[...connectSources].join(" ")}`,
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
];

if (process.env.APP_ENVIRONMENT === "production") {
  contentSecurityPolicyDirectives.push("upgrade-insecure-requests");
}

const contentSecurityPolicy = contentSecurityPolicyDirectives.join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  // Vercel creates and traces its own runtime output. Standalone is reserved
  // for the self-hosted Docker image assembled from .next/standalone.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks"],
  },
  async redirects() {
    return [
      {
        source: "/protected/:path*",
        destination: "/dashboard/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  webpack: { treeshake: { removeDebugLogging: true } },
});
