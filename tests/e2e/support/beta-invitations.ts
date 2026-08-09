import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import type { MarketplaceRole } from "../../../lib/domain-types";
import type { Database } from "../../../lib/supabase/types";

const legalMetadata = {
  legal_consent: true,
  legal_document_version: "local-development-v1",
};

export async function issueBetaInvitation(
  admin: SupabaseClient<Database>,
  email: string,
  role: MarketplaceRole,
) {
  const code = randomBytes(24).toString("base64url");
  const hash = createHash("sha256").update(code, "utf8").digest("hex");
  const { data, error } = await admin
    .from("beta_invitations")
    .insert({
      code_hash: hash,
      email: email.toLowerCase(),
      expires_at: new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
      role,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Could not issue the E2E beta invitation: ${error?.code ?? "no_data"}`);
  }

  return { code, hash, id: data.id };
}

export async function createInvitedUser(
  admin: SupabaseClient<Database>,
  input: {
    email: string;
    fullName: string;
    password: string;
    role: MarketplaceRole;
  },
) {
  const invitation = await issueBetaInvitation(admin, input.email, input.role);
  const result = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      beta_invitation_hash: invitation.hash,
      full_name: input.fullName,
      role: input.role,
      ...legalMetadata,
    },
  });

  if (result.error) {
    await admin.from("beta_invitations").delete().eq("id", invitation.id);
  }

  return result;
}
