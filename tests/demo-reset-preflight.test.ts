import { describe, expect, it } from "vitest";
import { missingDemoResetConfiguration } from "../scripts/demo-reset-preflight.mjs";

const completeEnvironment = {
  DEMO_SEED_PROJECT_REF: "demo-project",
  LEGAL_DOCUMENT_VERSION: "demo-v1",
  NEXT_PUBLIC_SUPABASE_URL: "https://demo-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  DEMO_FOUNDER_EMAIL: "founder@example.test",
  DEMO_FOUNDER_PASSWORD: "founder-password",
  DEMO_INVESTOR_EMAIL: "investor@example.test",
  DEMO_INVESTOR_PASSWORD: "investor-password",
};

describe("demo reset preflight", () => {
  it("accepts a complete Demo environment", () => {
    expect(missingDemoResetConfiguration(completeEnvironment)).toEqual([]);
  });

  it("reports missing values without reading or printing their contents", () => {
    expect(
      missingDemoResetConfiguration({
        ...completeEnvironment,
        SUPABASE_SERVICE_ROLE_KEY: "",
        DEMO_INVESTOR_PASSWORD: " ",
      }),
    ).toEqual(["SUPABASE_SERVICE_ROLE_KEY", "DEMO_INVESTOR_PASSWORD"]);
  });
});
