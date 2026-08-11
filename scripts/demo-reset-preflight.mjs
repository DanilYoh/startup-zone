import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const requiredNames = [
  "DEMO_SEED_PROJECT_REF",
  "LEGAL_DOCUMENT_VERSION",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DEMO_FOUNDER_EMAIL",
  "DEMO_FOUNDER_PASSWORD",
  "DEMO_INVESTOR_EMAIL",
  "DEMO_INVESTOR_PASSWORD",
];

export function missingDemoResetConfiguration(environment) {
  return requiredNames.filter((name) => !environment[name]?.trim());
}

export function runDemoResetPreflight(environment = process.env) {
  const missing = missingDemoResetConfiguration(environment);
  const configured = missing.length === 0;

  if (environment.GITHUB_OUTPUT) {
    appendFileSync(environment.GITHUB_OUTPUT, `configured=${configured}\n`, "utf8");
  }

  if (configured) {
    console.log("Demo reset configuration is complete.");
  } else {
    console.log(
      `::notice::Demo reset skipped. Missing GitHub Demo configuration: ${missing.join(", ")}.`,
    );
  }

  return { configured, missing };
}

const entrypoint = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;

if (entrypoint === import.meta.url) runDemoResetPreflight();
