import {
  getSiteOrigin,
  getSupabaseEnv,
  hasSupabaseConfiguration,
  isReadOnlyDemoEnabled,
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

  it("does not mistake a Vercel Preview build for production", () => {
    const previewEnvironment = {
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      VERCEL_URL: "startup-zone-preview.vercel.app",
    };

    expect(isProductionRuntime(previewEnvironment)).toBe(false);
    expect(validateProductionEnv(previewEnvironment)).toBeNull();
    expect(getSiteOrigin(previewEnvironment)).toBe(
      "https://startup-zone-preview.vercel.app",
    );
  });

  it("keeps Vercel production fail-closed and uses its immutable commit SHA", () => {
    const vercelProductionEnvironment = {
      ...productionEnvironment,
      APP_ENVIRONMENT: "test",
      RELEASE_VERSION: undefined,
      VERCEL_ENV: "production",
      VERCEL_GIT_COMMIT_SHA: "bf9eced21954aaeb24951b9248374e5d4d9e5fce",
    };

    expect(isProductionRuntime(vercelProductionEnvironment)).toBe(true);
    expect(validateProductionEnv(vercelProductionEnvironment)).toMatchObject({
      RELEASE_VERSION: "bf9eced21954aaeb24951b9248374e5d4d9e5fce",
    });
    expect(() =>
      validateProductionEnv({
        APP_ENVIRONMENT: "test",
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        VERCEL_GIT_COMMIT_SHA: "bf9eced21954aaeb24951b9248374e5d4d9e5fce",
      }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/u);
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

  it("enables read-only demo links only in the demo environment", () => {
    const environment = {
      APP_ENVIRONMENT: "demo",
      DEMO_READ_ONLY_ENABLED: "true",
    };

    expect(isReadOnlyDemoEnabled(environment)).toBe(true);
    expect(() =>
      isReadOnlyDemoEnabled({ ...environment, APP_ENVIRONMENT: "production" }),
    ).toThrow(/Invalid read-only demo environment/u);
  });
});
