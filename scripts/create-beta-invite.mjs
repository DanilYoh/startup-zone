import { createHash, randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { assertBetaInviteCreationAllowed } from "./beta-invite-guard.mjs";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    role: { type: "string" },
    "expires-in-days": { type: "string", default: "14" },
  },
  strict: true,
});

const email = values.email?.trim().toLowerCase() ?? "";
const role = values.role ?? "";
const expiresInDays = Number(values["expires-in-days"]);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  throw new Error("Provide a valid --email value.");
}

if (!["founder", "investor"].includes(role)) {
  throw new Error("Provide --role founder or --role investor.");
}

if (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 90) {
  throw new Error("--expires-in-days must be an integer from 1 to 90.");
}

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Invitation creation requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on a trusted operator machine.",
  );
}

const targetOrigin = assertBetaInviteCreationAllowed(process.env);
const invitationCode = randomBytes(24).toString("base64url");
const codeHash = createHash("sha256").update(invitationCode, "utf8").digest("hex");
const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1_000).toISOString();
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error } = await admin.from("beta_invitations").insert({
  code_hash: codeHash,
  email,
  expires_at: expiresAt,
  role,
});

if (error) {
  throw new Error(`Could not create the beta invitation: ${error.code}`);
}

console.log(JSON.stringify({
  email,
  expires_at: expiresAt,
  invitation_code: invitationCode,
  role,
  target: targetOrigin,
}, null, 2));
