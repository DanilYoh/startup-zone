import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { assertDemoSeedAllowed } from "./demo-seed-guard.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const legalDocumentVersion = process.env.LEGAL_DOCUMENT_VERSION ?? "local-development-v1";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Demo seeding requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for an isolated demo or test project.",
  );
}

const projectRef = assertDemoSeedAllowed(process.env);

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const founderEmail = process.env.DEMO_FOUNDER_EMAIL;
const founderPassword = process.env.DEMO_FOUNDER_PASSWORD;
const investorEmail = process.env.DEMO_INVESTOR_EMAIL;
const investorPassword = process.env.DEMO_INVESTOR_PASSWORD;

if (!founderEmail || !founderPassword || !investorEmail || !investorPassword) {
  throw new Error(
    "Demo reset requires DEMO_FOUNDER_EMAIL, DEMO_FOUNDER_PASSWORD, DEMO_INVESTOR_EMAIL, and DEMO_INVESTOR_PASSWORD.",
  );
}

if (founderPassword.length < 12 || investorPassword.length < 12) {
  throw new Error("Demo passwords must contain at least 12 characters.");
}

const demoStartups = [
  {
    title: "FlowPilot",
    slug: "flowpilot-operations-ai",
    one_pager:
      "An AI operations copilot that helps logistics teams resolve delivery exceptions before they become customer problems.",
    description:
      "FlowPilot connects shipment events, support signals, and operational playbooks in one workspace. It highlights high-risk exceptions, explains the likely cause, and proposes the next action for an operations manager to approve. The team is validating the product with regional logistics providers and is raising capital to deepen data integrations and workflow automation.",
    stage: "mvp",
    niche: ["AI", "B2B SaaS", "Logistics"],
    funding_ask: 350000,
    equity_offered: 7.5,
  },
  {
    title: "GreenLedger",
    slug: "greenledger-climate-reporting",
    one_pager:
      "A lightweight climate reporting platform that turns supplier activity into audit-ready emissions evidence for growing companies.",
    description:
      "GreenLedger gives finance and operations teams a practical way to collect supplier activity, calculate emissions, and keep the evidence behind every number. The product focuses on companies that have outgrown spreadsheets but are not ready for enterprise sustainability suites. The founders are seeking product and go-to-market collaborators as they prepare the next group of design partners.",
    stage: "pre_seed",
    niche: ["ClimateTech", "FinTech", "B2B SaaS"],
    funding_ask: 500000,
    equity_offered: 8,
  },
  {
    title: "CareBridge",
    slug: "carebridge-remote-care",
    one_pager:
      "A coordinated remote-care platform helping small clinics run structured follow-up programs with verified care partners.",
    description:
      "CareBridge helps independent clinics extend care beyond appointments without building a large internal coordination team. Clinics assemble follow-up programs, invite verified care partners, and track patient-facing milestones in a shared workflow. The current release is focused on operational validation, marketplace trust, and partnerships with regional clinic networks.",
    stage: "seed",
    niche: ["HealthTech", "Marketplace", "Future of Work"],
    funding_ask: 900000,
    equity_offered: 6,
  },
];

async function findUser(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email === email);
    if (user) return user;
    if (data.users.length < 100) return null;
  }

  throw new Error(`Could not determine whether demo user ${email} already exists.`);
}

async function ensureDemoUser({ email, fullName, password, role }) {
  const existing = await findUser(email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password,
      user_metadata: {
        ...existing.user_metadata,
        full_name: fullName,
        role,
      },
    });
    if (error) throw error;
    return data.user;
  }

  const invitationCode = randomBytes(24).toString("base64url");
  const invitationHash = createHash("sha256").update(invitationCode, "utf8").digest("hex");
  const { data: invitation, error: invitationError } = await admin
    .from("beta_invitations")
    .insert({
      code_hash: invitationHash,
      email,
      expires_at: new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
      role,
    })
    .select("id")
    .single();

  if (invitationError) throw invitationError;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      beta_invitation_hash: invitationHash,
      legal_consent: true,
      legal_document_version: legalDocumentVersion,
      role,
    },
  });

  if (error) {
    await admin.from("beta_invitations").delete().eq("id", invitation.id);
    throw error;
  }
  return data.user;
}

const founder = await ensureDemoUser({
  email: founderEmail,
  fullName: "Startup Zone Demo Founder",
  password: founderPassword,
  role: "founder",
});
const investor = await ensureDemoUser({
  email: investorEmail,
  fullName: "Startup Zone Demo Investor",
  password: investorPassword,
  role: "investor",
});

const { data: demoProfiles, error: demoProfilesError } = await admin
  .from("profiles")
  .select("id, role")
  .in("id", [founder.id, investor.id]);

if (demoProfilesError) throw demoProfilesError;
const roleById = new Map(demoProfiles.map((profile) => [profile.id, profile.role]));
if (roleById.get(founder.id) !== "founder" || roleById.get(investor.id) !== "investor") {
  throw new Error("Existing demo identities have unexpected immutable marketplace roles.");
}

const { error: profileError } = await admin
  .from("profiles")
  .update({
    full_name: "Startup Zone Demo Founder",
    headline: "Founders building workflow products",
    bio: "A synthetic founder profile used exclusively for the public Startup Zone demo.",
    founder_experience:
      "A synthetic track record used to demonstrate the founder profile structure without exposing personal data.",
    location: "Yekaterinburg, Russia",
  })
  .eq("id", founder.id);

if (profileError) throw profileError;

const { error: investorProfileError } = await admin
  .from("profiles")
  .update({
    full_name: "Startup Zone Demo Investor",
    headline: "Seed investor focused on B2B software",
    bio: "A synthetic investor profile used exclusively for the public Startup Zone demo.",
    investor_organization: "Demo Seed Partners",
    investment_thesis:
      "Synthetic early-stage investment mandate for workflow software with measurable customer value.",
    location: "Moscow, Russia",
    preferred_stages: ["mvp", "pre_seed", "seed"],
    ticket_min: 100000,
    ticket_max: 1000000,
  })
  .eq("id", investor.id);

if (investorProfileError) throw investorProfileError;

const { error: contactError } = await admin.from("profile_contacts").upsert([
  {
    profile_id: founder.id,
    contact_email: founderEmail,
    contact_url: null,
    sharing_enabled: true,
  },
  {
    profile_id: investor.id,
    contact_email: investorEmail,
    contact_url: null,
    sharing_enabled: true,
  },
]);

if (contactError) throw contactError;

const { data: previousStartups, error: previousStartupsError } = await admin
  .from("startups")
  .select("id")
  .eq("founder_id", founder.id);

if (previousStartupsError) throw previousStartupsError;

const previousStartupIds = previousStartups.map(({ id }) => id);
if (previousStartupIds.length > 0) {
  const { error: auditError } = await admin
    .from("application_status_audit")
    .delete()
    .in("startup_id", previousStartupIds);
  if (auditError) throw auditError;

  const { error: applicationDeleteError } = await admin
    .from("applications")
    .delete()
    .in("startup_id", previousStartupIds);
  if (applicationDeleteError) throw applicationDeleteError;

  const { error: startupDeleteError } = await admin
    .from("startups")
    .delete()
    .in("id", previousStartupIds);
  if (startupDeleteError) throw startupDeleteError;
}

const rows = demoStartups.map((startup) => ({
  ...startup,
  founder_id: founder.id,
  deck_url: null,
  website_url: null,
  is_active: true,
}));

const { data: seededStartups, error: startupError } = await admin
  .from("startups")
  .insert(rows)
  .select("id, slug");

if (startupError) throw startupError;

const startupBySlug = new Map(seededStartups.map((startup) => [startup.slug, startup.id]));
const pendingStartupId = startupBySlug.get("flowpilot-operations-ai");
const acceptedStartupId = startupBySlug.get("greenledger-climate-reporting");
if (!pendingStartupId || !acceptedStartupId) {
  throw new Error("Demo startups were not returned after reset.");
}
const { error: applicationError } = await admin.from("applications").insert([
  {
    startup_id: pendingStartupId,
    applicant_id: investor.id,
    type: "investor",
    message:
      "Synthetic pending interest request for demonstrating the founder moderation workflow.",
    status: "pending",
  },
  {
    startup_id: acceptedStartupId,
    applicant_id: investor.id,
    type: "investor",
    message:
      "Synthetic accepted request for demonstrating consent-based private contact exchange.",
    status: "accepted",
  },
]);

if (applicationError) throw applicationError;

console.log(
  `Reset two demo accounts, ${rows.length} startups, and two applications in isolated project ${projectRef}.`,
);
