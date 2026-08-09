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

  it("continues protecting application routes", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig, url: "/dashboard" }),
    ).toBe(true);
  });
});
