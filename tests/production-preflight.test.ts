import {
  runProductionPreflight,
  validateProductionPreflightEnvironment,
} from "../scripts/production-preflight-core.mjs";
import { describe, expect, it, vi } from "vitest";

const validEnvironment = {
  APP_ENVIRONMENT: "production",
  LEGAL_DOCUMENT_APPROVED: "true",
  LEGAL_DOCUMENT_EFFECTIVE_DATE: "2026-08-09",
  LEGAL_DOCUMENT_VERSION: "privacy-2026-08-v1",
  LEGAL_OPERATOR_ADDRESS: "620000, Екатеринбург, улица Мира, 1",
  LEGAL_OPERATOR_EMAIL: "privacy@startup-zone.ru",
  LEGAL_OPERATOR_NAME: "ООО Стартап Зона",
  LEGAL_PROCESSORS: "Российский хостинг; Российский почтовый сервис",
  NEXT_PUBLIC_SITE_URL: "https://startup-zone.ru",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_production_1234567890",
  NEXT_PUBLIC_SUPABASE_URL: "https://api.startup-zone.ru",
  RELEASE_VERSION: "a1b2c3d4e5f6",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_production_1234567890",
};

function legacyJwt(role: "anon" | "service_role") {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ role })).toString("base64url");
  return `${header}.${payload}.production-signature`;
}

function queryResult(result: object) {
  const chain = {
    eq: vi.fn(() => chain),
    limit: vi.fn(async () => result),
    select: vi.fn(() => chain),
    then: (resolve: (value: object) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

function response(body: string | object, status = 200) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
}

function completeHtml(config: ReturnType<typeof validateProductionPreflightEnvironment>) {
  const effectiveDateLabel = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" })
    .format(new Date(`${config.legalEffectiveDate}T00:00:00.000Z`));
  return [
    config.legalDocumentVersion,
    effectiveDateLabel,
    config.legalOperatorAddress,
    config.legalOperatorName,
    config.legalOperatorEmail,
    ...config.legalProcessors,
  ].join(" ");
}

function successfulDependencies(config: ReturnType<typeof validateProductionPreflightEnvironment>) {
  const legalQuery = queryResult({
    data: [{
      effective_date: config.legalEffectiveDate,
      is_active: true,
      version: config.legalDocumentVersion,
    }],
    error: null,
  });
  const invitationQuery = queryResult({ count: 3, data: null, error: null });
  const adminClient = {
    from: vi.fn((table: string) => table === "legal_document_versions" ? legalQuery : invitationQuery),
  };
  const publicClient = {
    rpc: vi.fn(async () => ({ data: false, error: null })),
  };
  const legalHtml = completeHtml(config);
  const fetchImpl = vi.fn(async (input: string | URL | Request) => {
    const url = input.toString();
    if (url.endsWith("/healthz")) return response({ status: "ok" });
    if (url.endsWith("/readyz")) return response({ status: "ok" });
    if (url.endsWith("/auth/v1/health")) return response("ok");
    if (url.endsWith("/auth/sign-up")) return response(`${legalHtml} Код приглашения`);
    return response(legalHtml);
  });

  return { adminClient, fetchImpl, publicClient };
}

describe("production preflight environment", () => {
  it("accepts complete production-only configuration and normalizes origins", () => {
    expect(validateProductionPreflightEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_SITE_URL: "https://startup-zone.ru/",
    })).toMatchObject({
      legalDocumentVersion: "privacy-2026-08-v1",
      siteOrigin: "https://startup-zone.ru",
      supabaseOrigin: "https://api.startup-zone.ru",
    });
  });

  it("accepts an immutable semantic release tag", () => {
    expect(validateProductionPreflightEnvironment({
      ...validEnvironment,
      RELEASE_VERSION: "v1.0.0",
    }).releaseVersion).toBe("v1.0.0");
  });

  it("accepts legacy self-hosted anon and service-role JWT kinds", () => {
    expect(validateProductionPreflightEnvironment({
      ...validEnvironment,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: legacyJwt("anon"),
      SUPABASE_SERVICE_ROLE_KEY: legacyJwt("service_role"),
    })).toMatchObject({
      publishableKey: legacyJwt("anon"),
      serviceRoleKey: legacyJwt("service_role"),
    });
  });

  it.each([
    ["a non-production environment", { APP_ENVIRONMENT: "local" }, "APP_ENVIRONMENT must be production"],
    ["an HTTP site", { NEXT_PUBLIC_SITE_URL: "http://startup-zone.ru" }, "absolute HTTPS origin"],
    ["a placeholder API", { NEXT_PUBLIC_SUPABASE_URL: "https://api.example.com" }, "real, non-local production origin"],
    ["an IP-literal API", { NEXT_PUBLIC_SUPABASE_URL: "https://10.0.0.1" }, "real, non-local production origin"],
    ["a secret public key", { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_production_1234567890" }, "must be an anon JWT or sb_publishable_ key"],
    ["unapproved documents", { LEGAL_DOCUMENT_APPROVED: "false" }, "LEGAL_DOCUMENT_APPROVED must be true"],
    ["a draft legal version", { LEGAL_DOCUMENT_VERSION: "draft-2026-v1" }, "approved, non-draft"],
    ["an invalid effective date", { LEGAL_DOCUMENT_EFFECTIVE_DATE: "2026-02-31" }, "real ISO date"],
    ["placeholder processors", { LEGAL_PROCESSORS: "replace-with-provider" }, "real production processors"],
    ["a mutable release", { RELEASE_VERSION: "latest" }, "immutable commit SHA or release tag"],
  ])("rejects %s", (_name, override, message) => {
    expect(() => validateProductionPreflightEnvironment({
      ...validEnvironment,
      ...override,
    })).toThrow(message);
  });
});

describe("production preflight checks", () => {
  it("verifies the deployed read-only production contour without exposing credentials", async () => {
    const config = validateProductionPreflightEnvironment(validEnvironment);
    const dependencies = successfulDependencies(config);
    const report = await runProductionPreflight({
      ...dependencies,
      config,
      now: () => new Date("2026-08-09T12:00:00.000Z"),
    });

    expect(report).toMatchObject({
      checked_at: "2026-08-09T12:00:00.000Z",
      legal_document_version: "privacy-2026-08-v1",
      release_version: "a1b2c3d4e5f6",
      target: {
        app: "https://startup-zone.ru",
        supabase: "https://api.startup-zone.ru",
      },
    });
    expect(report.checks).toHaveLength(9);
    expect(JSON.stringify(report)).not.toContain(config.publishableKey);
    expect(JSON.stringify(report)).not.toContain(config.serviceRoleKey);
    expect(dependencies.publicClient.rpc).toHaveBeenCalledWith("is_beta_invitation_valid", {
      candidate_email: "production-preflight@never-match.invalid",
      candidate_hash: "0".repeat(64),
      candidate_role: "founder",
    });
    expect(dependencies.adminClient.from.mock.calls).toEqual([
      ["legal_document_versions"],
      ["beta_invitations"],
    ]);
  });

  it("fails when the deployed legal page does not contain the approved version", async () => {
    const config = validateProductionPreflightEnvironment(validEnvironment);
    const dependencies = successfulDependencies(config);
    dependencies.fetchImpl.mockImplementation(async (input: string | URL | Request) => {
      const url = input.toString();
      if (url.endsWith("/healthz")) return response({ status: "ok" });
      if (url.endsWith("/readyz")) return response({ status: "ok" });
      if (url.endsWith("/auth/v1/health")) return response("ok");
      return response("stale legal content");
    });

    await expect(runProductionPreflight({ ...dependencies, config })).rejects.toThrow(
      "privacy_document does not contain the approved runtime content",
    );
  });

  it("fails when the active database version differs from the runtime", async () => {
    const config = validateProductionPreflightEnvironment(validEnvironment);
    const dependencies = successfulDependencies(config);
    dependencies.adminClient.from.mockImplementation((table: string) => queryResult(table === "legal_document_versions"
      ? { data: [{ effective_date: "2026-08-01", is_active: true, version: "privacy-old-v1" }], error: null }
      : { count: 0, data: null, error: null }));

    await expect(runProductionPreflight({ ...dependencies, config })).rejects.toThrow(
      "active database legal version does not exactly match",
    );
  });

  it("fails when an impossible invitation is accepted", async () => {
    const config = validateProductionPreflightEnvironment(validEnvironment);
    const dependencies = successfulDependencies(config);
    dependencies.publicClient.rpc.mockResolvedValue({ data: true, error: null });

    await expect(runProductionPreflight({ ...dependencies, config })).rejects.toThrow(
      "impossible public invitation probe was not rejected",
    );
  });
});
