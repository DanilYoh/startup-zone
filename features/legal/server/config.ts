import "server-only";

import type { PublicLegalConfig } from "@/features/legal/types";
import { z } from "zod";

export const LOCAL_LEGAL_DOCUMENT_VERSION = "local-development-v1";

const versionSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9._-]+$/);

const dateSchema = z.iso.date();
const emailSchema = z.email();

function envValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function configuredProcessors() {
  return envValue("LEGAL_PROCESSORS")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function isProductionSafeVersion(value: string) {
  return (
    versionSchema.safeParse(value).success &&
    !value.startsWith("draft") &&
    !value.startsWith("local") &&
    !value.startsWith("test")
  );
}

export function getPublicLegalConfig(): PublicLegalConfig {
  const isProduction = envValue("APP_ENVIRONMENT") === "production";
  const configured = {
    documentVersion: envValue("LEGAL_DOCUMENT_VERSION"),
    effectiveDate: envValue("LEGAL_DOCUMENT_EFFECTIVE_DATE"),
    operatorAddress: envValue("LEGAL_OPERATOR_ADDRESS"),
    operatorEmail: envValue("LEGAL_OPERATOR_EMAIL"),
    operatorName: envValue("LEGAL_OPERATOR_NAME"),
    processors: configuredProcessors(),
  };

  if (!isProduction) {
    return {
      documentVersion: configured.documentVersion || LOCAL_LEGAL_DOCUMENT_VERSION,
      effectiveDate: dateSchema.safeParse(configured.effectiveDate).success
        ? configured.effectiveDate
        : "2026-08-09",
      mode: "draft",
      operatorAddress:
        configured.operatorAddress || "Локальная среда разработки; адрес оператора не задан",
      operatorEmail: emailSchema.safeParse(configured.operatorEmail).success
        ? configured.operatorEmail
        : "privacy@example.test",
      operatorName: configured.operatorName || "Startup Zone (локальная разработка)",
      processors:
        configured.processors.length > 0
          ? configured.processors
          : ["Локальная инфраструктура разработки"],
      registrationEnabled: true,
    };
  }

  const approved = envValue("LEGAL_DOCUMENT_APPROVED") === "true";
  const complete =
    approved &&
    isProductionSafeVersion(configured.documentVersion) &&
    dateSchema.safeParse(configured.effectiveDate).success &&
    configured.operatorName.length >= 3 &&
    configured.operatorAddress.length >= 5 &&
    emailSchema.safeParse(configured.operatorEmail).success &&
    configured.processors.length > 0;

  return {
    documentVersion: complete ? configured.documentVersion : "",
    effectiveDate: complete ? configured.effectiveDate : "",
    mode: complete ? "approved" : "blocked",
    operatorAddress: complete ? configured.operatorAddress : "Не настроен",
    operatorEmail: complete ? configured.operatorEmail : "Не настроен",
    operatorName: complete ? configured.operatorName : "Оператор не настроен",
    processors: complete ? configured.processors : [],
    registrationEnabled: complete,
  };
}
