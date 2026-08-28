import nextConfig from "@/next.config";
import { createContentSecurityPolicy } from "@/lib/security-headers";
import { config, proxy } from "@/proxy";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateSessionMock } = vi.hoisted(() => ({ updateSessionMock: vi.fn() }));

vi.mock("@/lib/supabase/proxy", () => ({ updateSession: updateSessionMock }));

beforeEach(() => {
  updateSessionMock.mockReset().mockResolvedValue(NextResponse.next());
});

describe("proxy matcher", () => {
  it("keeps AGENTS.md under repository control", () => {
    expect(nextConfig.agentRules).toBe(false);
  });

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

  it("publishes a nonce-based Content Security Policy", () => {
    const csp = createContentSecurityPolicy("request-nonce", {
      APP_ENVIRONMENT: "production",
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    });

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("script-src 'self' 'nonce-request-nonce' 'strict-dynamic'");
    expect(csp).toContain("style-src 'self' 'nonce-request-nonce'");
    expect(csp).toContain("img-src 'self' data: https:");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it("forwards the same request nonce that it publishes in the response", async () => {
    const response = await proxy(new NextRequest("https://startup-zone.example/startups"));
    const forwardedHeaders = updateSessionMock.mock.calls[0]?.[1] as Headers;
    const nonce = forwardedHeaders.get("x-nonce");

    expect(nonce).toMatch(/^[0-9a-f]{32}$/u);
    expect(forwardedHeaders.get("content-security-policy")).toContain(
      `'nonce-${nonce}'`,
    );
    expect(response.headers.get("content-security-policy")).toBe(
      forwardedHeaders.get("content-security-policy"),
    );
  });

  it("continues protecting application routes", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig, url: "/dashboard" }),
    ).toBe(true);
  });
});
