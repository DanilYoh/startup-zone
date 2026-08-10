import {
  getDemoCredentials,
  getSiteOrigin,
  getSupabaseEnv,
  hasSupabaseConfiguration,
  isDemoAccessEnabled,
  isProductionRuntime,
  validateProductionEnv,
} from "@/lib/env";
import { describe, expect, it } from "vitest";

const productionEnvironment = {
  APP_ENVIRONMENT: "production",
  NEXT_PUBLIC_SITE_URL: "https://startup-zone.example",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
  RELEASE_VERSION: "v1.2.3",
};

describe("runtime environment", () => {
  it("accepts a complete HTTPS production environment", () => {
    expect(validateProductionEnv(productionEnvironment)).toMatchObject({
      NEXT_PUBLIC_SITE_URL: "https://startup-zone.example",
      RELEASE_VERSION: "v1.2.3",
    });
    expect(getSiteOrigin(productionEnvironment)).toBe("https://startup-zone.example");
  });

  it("fails closed without required production values", () => {
    expect(() =>
      validateProductionEnv({ APP_ENVIRONMENT: "production" }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/u);
    expect(() =>
      validateProductionEnv({
        ...productionEnvironment,
        NEXT_PUBLIC_SITE_URL: "http://startup-zone.example",
      }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/u);
  });

  it("treats an unlabeled Node production process as production", () => {
    expect(isProductionRuntime({ NODE_ENV: "production" })).toBe(true);
    expect(() => getSiteOrigin({ NODE_ENV: "production" })).toThrow(
      /Invalid production environment/u,
    );
  });

  it("allows a localhost fallback only for an explicit non-production environment", () => {
    expect(getSiteOrigin({ APP_ENVIRONMENT: "local", NODE_ENV: "production" })).toBe(
      "http://localhost:3000",
    );
  });

  it("rejects partial Supabase configuration", () => {
    expect(hasSupabaseConfiguration({ APP_ENVIRONMENT: "local" })).toBe(false);
    expect(() =>
      hasSupabaseConfiguration({
        APP_ENVIRONMENT: "local",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/u);
    expect(
      getSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-key",
      }),
    ).toMatchObject({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-key" });
  });

  it("enables one-click accounts only in a fully configured demo environment", () => {
    const environment = {
      APP_ENVIRONMENT: "demo",
      DEMO_ACCESS_ENABLED: "true",
      DEMO_FOUNDER_EMAIL: "founder@example.test",
      DEMO_FOUNDER_PASSWORD: "founder-password",
      DEMO_INVESTOR_EMAIL: "investor@example.test",
      DEMO_INVESTOR_PASSWORD: "investor-password",
    };

    expect(isDemoAccessEnabled(environment)).toBe(true);
    expect(getDemoCredentials("investor", environment)).toEqual({
      email: "investor@example.test",
      password: "investor-password",
    });
    expect(() =>
      isDemoAccessEnabled({ ...environment, APP_ENVIRONMENT: "production" }),
    ).toThrow(/Invalid demo access environment/u);
  });
});
