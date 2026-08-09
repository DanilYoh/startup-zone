import { assertBetaInviteCreationAllowed } from "../scripts/beta-invite-guard.mjs";
import { describe, expect, it } from "vitest";

const validEnvironment = {
  ALLOW_BETA_INVITE_CREATE: "true",
  APP_ENVIRONMENT: "test",
  BETA_INVITE_TARGET_URL: "https://test-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
};

describe("beta invitation operator guard", () => {
  it("accepts an explicitly approved exact target", () => {
    expect(assertBetaInviteCreationAllowed(validEnvironment)).toBe(
      "https://test-project.supabase.co",
    );
  });

  it("requires explicit write authorization", () => {
    expect(() => assertBetaInviteCreationAllowed({
      ...validEnvironment,
      ALLOW_BETA_INVITE_CREATE: "false",
    })).toThrow("Set ALLOW_BETA_INVITE_CREATE=true");
  });

  it("rejects a different target even within the same environment", () => {
    expect(() => assertBetaInviteCreationAllowed({
      ...validEnvironment,
      NEXT_PUBLIC_SUPABASE_URL: "https://other-project.supabase.co",
    })).toThrow("Invitation target mismatch");
  });

  it("rejects a local target declared as production", () => {
    expect(() => assertBetaInviteCreationAllowed({
      ...validEnvironment,
      APP_ENVIRONMENT: "production",
      BETA_INVITE_TARGET_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    })).toThrow("Production invitation creation cannot target a local Supabase instance");
  });

  it("requires HTTPS for a remote production target", () => {
    expect(() => assertBetaInviteCreationAllowed({
      ...validEnvironment,
      APP_ENVIRONMENT: "production",
      BETA_INVITE_TARGET_URL: "http://api.example.ru",
      NEXT_PUBLIC_SUPABASE_URL: "http://api.example.ru",
    })).toThrow("Production invitation creation requires an HTTPS Supabase target");
  });
});
