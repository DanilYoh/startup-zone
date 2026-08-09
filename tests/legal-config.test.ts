import { getPublicLegalConfig, LOCAL_LEGAL_DOCUMENT_VERSION } from "@/features/legal/server/config";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const legalEnvNames = [
  "LEGAL_DOCUMENT_APPROVED",
  "LEGAL_DOCUMENT_VERSION",
  "LEGAL_DOCUMENT_EFFECTIVE_DATE",
  "LEGAL_OPERATOR_NAME",
  "LEGAL_OPERATOR_ADDRESS",
  "LEGAL_OPERATOR_EMAIL",
  "LEGAL_PROCESSORS",
] as const;

function clearLegalEnv() {
  for (const name of legalEnvNames) vi.stubEnv(name, "");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("legal registration configuration", () => {
  it("uses an explicit draft version only outside production", () => {
    vi.stubEnv("APP_ENVIRONMENT", "local");
    clearLegalEnv();

    expect(getPublicLegalConfig()).toMatchObject({
      documentVersion: LOCAL_LEGAL_DOCUMENT_VERSION,
      mode: "draft",
      registrationEnabled: true,
    });
  });

  it("fails closed when production legal details are incomplete", () => {
    vi.stubEnv("APP_ENVIRONMENT", "production");
    clearLegalEnv();

    expect(getPublicLegalConfig()).toMatchObject({
      documentVersion: "",
      mode: "blocked",
      registrationEnabled: false,
    });
  });

  it("enables production only for an approved, complete, non-draft version", () => {
    vi.stubEnv("APP_ENVIRONMENT", "production");
    vi.stubEnv("LEGAL_DOCUMENT_APPROVED", "true");
    vi.stubEnv("LEGAL_DOCUMENT_VERSION", "privacy-2026-08-v1");
    vi.stubEnv("LEGAL_DOCUMENT_EFFECTIVE_DATE", "2026-08-20");
    vi.stubEnv("LEGAL_OPERATOR_NAME", "ООО Стартап Зона");
    vi.stubEnv("LEGAL_OPERATOR_ADDRESS", "620000, Россия, г. Екатеринбург");
    vi.stubEnv("LEGAL_OPERATOR_EMAIL", "privacy@startup-zone.ru");
    vi.stubEnv("LEGAL_PROCESSORS", "Российский хостинг; Сервис транзакционной почты");

    expect(getPublicLegalConfig()).toEqual({
      documentVersion: "privacy-2026-08-v1",
      effectiveDate: "2026-08-20",
      mode: "approved",
      operatorAddress: "620000, Россия, г. Екатеринбург",
      operatorEmail: "privacy@startup-zone.ru",
      operatorName: "ООО Стартап Зона",
      processors: ["Российский хостинг", "Сервис транзакционной почты"],
      registrationEnabled: true,
    });
  });

  it("rejects local or draft version names in production", () => {
    vi.stubEnv("APP_ENVIRONMENT", "production");
    vi.stubEnv("LEGAL_DOCUMENT_APPROVED", "true");
    vi.stubEnv("LEGAL_DOCUMENT_VERSION", LOCAL_LEGAL_DOCUMENT_VERSION);
    vi.stubEnv("LEGAL_DOCUMENT_EFFECTIVE_DATE", "2026-08-20");
    vi.stubEnv("LEGAL_OPERATOR_NAME", "ООО Стартап Зона");
    vi.stubEnv("LEGAL_OPERATOR_ADDRESS", "620000, Россия, г. Екатеринбург");
    vi.stubEnv("LEGAL_OPERATOR_EMAIL", "privacy@startup-zone.ru");
    vi.stubEnv("LEGAL_PROCESSORS", "Российский хостинг");

    expect(getPublicLegalConfig().registrationEnabled).toBe(false);
  });
});
