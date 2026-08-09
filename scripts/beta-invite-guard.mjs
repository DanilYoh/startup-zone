const allowedEnvironments = new Set(["local", "test", "demo", "production"]);

function normalizedOrigin(value, name) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.origin;
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) URL.`);
  }
}

export function assertBetaInviteCreationAllowed(environment) {
  if (environment.ALLOW_BETA_INVITE_CREATE !== "true") {
    throw new Error("Set ALLOW_BETA_INVITE_CREATE=true to authorize invitation creation.");
  }

  const appEnvironment = environment.APP_ENVIRONMENT ?? "";
  if (!allowedEnvironments.has(appEnvironment)) {
    throw new Error("APP_ENVIRONMENT must be local, test, demo, or production.");
  }

  const actualOrigin = normalizedOrigin(
    environment.NEXT_PUBLIC_SUPABASE_URL ?? "",
    "NEXT_PUBLIC_SUPABASE_URL",
  );
  const approvedOrigin = normalizedOrigin(
    environment.BETA_INVITE_TARGET_URL ?? "",
    "BETA_INVITE_TARGET_URL",
  );

  if (actualOrigin !== approvedOrigin) {
    throw new Error(
      `Invitation target mismatch: approved ${approvedOrigin}, received ${actualOrigin}.`,
    );
  }

  if (appEnvironment === "production") {
    const productionTarget = new URL(actualOrigin);
    if (["127.0.0.1", "localhost"].includes(productionTarget.hostname)) {
      throw new Error("Production invitation creation cannot target a local Supabase instance.");
    }
    if (productionTarget.protocol !== "https:") {
      throw new Error("Production invitation creation requires an HTTPS Supabase target.");
    }
  }

  return actualOrigin;
}
