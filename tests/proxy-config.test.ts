import nextConfig from "@/next.config";
import { config } from "@/proxy";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

describe("proxy matcher", () => {
  it("keeps liveness checks independent from Supabase", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig, url: "/healthz" }),
    ).toBe(false);
  });

  it("lets readiness perform its own Supabase probe", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig, url: "/readyz" }),
    ).toBe(false);
  });

  it("publishes a restrictive Content Security Policy", async () => {
    const configuredHeaders = await nextConfig.headers?.();
    const headers = configuredHeaders?.[0]?.headers ?? [];
    const csp = headers.find((header) => header.key === "Content-Security-Policy")?.value;

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it("continues protecting application routes", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig, url: "/dashboard" }),
    ).toBe(true);
  });
});
