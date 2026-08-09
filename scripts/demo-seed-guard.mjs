const allowedEnvironments = new Set(["local", "test", "demo"]);

function projectRefFromUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }

  if (["127.0.0.1", "localhost"].includes(url.hostname)) return "local";

  const hostedProject = url.hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i);
  if (!hostedProject) {
    throw new Error("Demo seeding accepts only local Supabase or a project-ref.supabase.co URL.");
  }

  return hostedProject[1];
}

export function assertDemoSeedAllowed(environment) {
  if (environment.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Set ALLOW_DEMO_SEED=true to explicitly authorize synthetic demo writes.");
  }

  if (!allowedEnvironments.has(environment.APP_ENVIRONMENT ?? "")) {
    throw new Error("APP_ENVIRONMENT must be local, test, or demo. Production seeding is blocked.");
  }

  const configuredRef = environment.DEMO_SEED_PROJECT_REF;
  if (!configuredRef) {
    throw new Error("DEMO_SEED_PROJECT_REF must name the exact local, test, or demo project.");
  }

  const actualRef = projectRefFromUrl(environment.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (configuredRef !== actualRef) {
    throw new Error(
      `Demo seed target mismatch: expected ${configuredRef}, received ${actualRef}.`,
    );
  }

  return actualRef;
}
