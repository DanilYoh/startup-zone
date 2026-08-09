import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { assertDemoSeedAllowed } from "./demo-seed-guard.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Demo seeding requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for an isolated demo or test project.",
  );
}

const projectRef = assertDemoSeedAllowed(process.env);

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const founderEmail = "demo-founder@startup-zone.example";
const demoStartups = [
  {
    title: "FlowPilot",
    slug: "flowpilot-operations-ai",
    one_pager:
      "An AI operations copilot that helps logistics teams resolve delivery exceptions before they become customer problems.",
    description:
      "FlowPilot connects shipment events, support signals, and operational playbooks in one workspace. It highlights high-risk exceptions, explains the likely cause, and proposes the next action for an operations manager to approve. The team is validating the product with regional logistics providers and is looking for specialists who can strengthen data integrations and workflow design.",
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
      "A coordinated remote-care marketplace connecting small clinics with verified specialists for structured follow-up programs.",
    description:
      "CareBridge helps independent clinics extend care beyond appointments without building a large internal coordination team. Clinics assemble follow-up programs, invite verified specialists, and track patient-facing milestones in a shared workflow. The current release is focused on operational validation, marketplace trust, and partnerships with regional clinic networks.",
    stage: "seed",
    niche: ["HealthTech", "Marketplace", "Future of Work"],
    funding_ask: 900000,
    equity_offered: 6,
  },
];

async function findFounder() {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email === founderEmail);
    if (user) return user;
    if (data.users.length < 100) return null;
  }

  throw new Error("Could not determine whether the demo founder already exists.");
}

let founder = await findFounder();

if (!founder) {
  const { data, error } = await admin.auth.admin.createUser({
    email: founderEmail,
    password: `Demo-${randomUUID()}-Aa1!`,
    email_confirm: true,
    user_metadata: {
      full_name: "Startup Zone Demo Team",
      role: "founder",
    },
  });

  if (error) throw error;
  founder = data.user;
}

if (!founder) throw new Error("The demo founder could not be created.");

const { error: profileError } = await admin
  .from("profiles")
  .update({
    full_name: "Startup Zone Demo Team",
    bio: "A synthetic founder profile used exclusively for the public Startup Zone demo.",
    location: "Yekaterinburg, Russia",
  })
  .eq("id", founder.id);

if (profileError) throw profileError;

const rows = demoStartups.map((startup) => ({
  ...startup,
  founder_id: founder.id,
  deck_url: null,
  website_url: null,
  is_active: true,
}));

const { error: startupError } = await admin.from("startups").upsert(rows, {
  onConflict: "slug",
});

if (startupError) throw startupError;

console.log(
  `Seeded ${rows.length} demo startups in ${projectRef}: ${rows.map(({ slug }) => slug).join(", ")}`,
);
