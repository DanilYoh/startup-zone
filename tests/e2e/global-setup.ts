import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/types";

const TEST_LEGAL_DOCUMENT_VERSION = "local-development-v1";
const allowedEnvironments = new Set(["local", "test", "demo"]);

export default async function globalSetup() {
  const environment = process.env.APP_ENVIRONMENT ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!allowedEnvironments.has(environment)) {
    throw new Error(
      "E2E setup requires APP_ENVIRONMENT=local, test, or demo. Production is blocked.",
    );
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "E2E setup requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from an isolated local or test project.",
    );
  }

  const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: versionError } = await admin
    .from("legal_document_versions")
    .upsert({
      effective_date: "2026-08-09",
      is_active: false,
      title: "Local development privacy and consent draft",
      version: TEST_LEGAL_DOCUMENT_VERSION,
    });

  if (versionError) {
    throw new Error(`Could not prepare the E2E legal-document version: ${versionError.code}`);
  }

  const { error: deactivateError } = await admin
    .from("legal_document_versions")
    .update({ is_active: false })
    .neq("version", TEST_LEGAL_DOCUMENT_VERSION);

  if (deactivateError) {
    throw new Error(`Could not deactivate stale E2E legal-document versions: ${deactivateError.code}`);
  }

  const { error: activateError } = await admin
    .from("legal_document_versions")
    .update({ is_active: true })
    .eq("version", TEST_LEGAL_DOCUMENT_VERSION);

  if (activateError) {
    throw new Error(`Could not activate the E2E legal-document version: ${activateError.code}`);
  }
}
