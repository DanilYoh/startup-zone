import { isIP } from "node:net";

const placeholderTextPattern = /(replace(?:[-_ ]with)?|placeholder|example|не настро)/i;
const unsafeLegalVersionPattern = /^(draft|local|test)(?:[-_.]|$)/i;
const unsafeReleasePattern = /^(development|latest|unknown|draft|local|test|replace)(?:[-_.]|$)/i;
const localHostnames = new Set(["0.0.0.0", "127.0.0.1", "::1", "localhost"]);
const versionPattern = /^[a-z0-9][a-z0-9._-]{2,79}$/;
const releasePattern = /^[A-Za-z0-9][A-Za-z0-9._/+:-]{5,127}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredValue(environment, name) {
  const value = environment[name]?.trim() ?? "";

  if (!value) {
    throw new Error(`${name} is required for production preflight.`);
  }

  return value;
}

function productionOrigin(environment, name) {
  const value = requiredValue(environment, name);
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTPS origin.`);
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${name} must be an absolute HTTPS origin without credentials, a path, query, or fragment.`);
  }

  const hostname = url.hostname.toLowerCase();
  const unwrappedHostname = hostname.replace(/^\[|\]$/g, "");
  if (
    isIP(unwrappedHostname) !== 0 ||
    localHostnames.has(hostname) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".invalid") ||
    hostname.endsWith(".example") ||
    hostname.endsWith(".example.com") ||
    hostname.endsWith(".example.net") ||
    hostname.endsWith(".example.org") ||
    hostname.includes("your-")
  ) {
    throw new Error(`${name} must target a real, non-local production origin.`);
  }

  return url.origin;
}

function productionText(environment, name, minimumLength) {
  const value = requiredValue(environment, name);

  if (value.length < minimumLength || placeholderTextPattern.test(value)) {
    throw new Error(`${name} still contains an unsafe or placeholder production value.`);
  }

  return value;
}

function productionKey(environment, name) {
  const value = requiredValue(environment, name);

  if (value.length < 20 || /^(your-|replace|placeholder)/i.test(value)) {
    throw new Error(`${name} is not a usable production credential.`);
  }

  return value;
}

function jwtRole(value) {
  const parts = value.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function validateCredentialKinds(publishableKey, serviceRoleKey) {
  const publishableKindIsValid = publishableKey.startsWith("sb_publishable_") || jwtRole(publishableKey) === "anon";
  const serviceKindIsValid = serviceRoleKey.startsWith("sb_secret_") || jwtRole(serviceRoleKey) === "service_role";

  if (!publishableKindIsValid) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be an anon JWT or sb_publishable_ key, never a secret/service-role key.");
  }

  if (!serviceKindIsValid) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be a service-role JWT or sb_secret_ key on the trusted operator machine.");
  }
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value);
}

export function validateProductionPreflightEnvironment(environment) {
  if ((environment.APP_ENVIRONMENT?.trim() ?? "") !== "production") {
    throw new Error("APP_ENVIRONMENT must be production for production preflight.");
  }

  const siteOrigin = productionOrigin(environment, "NEXT_PUBLIC_SITE_URL");
  const supabaseOrigin = productionOrigin(environment, "NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = productionKey(environment, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = productionKey(environment, "SUPABASE_SERVICE_ROLE_KEY");
  validateCredentialKinds(publishableKey, serviceRoleKey);

  if ((environment.LEGAL_DOCUMENT_APPROVED?.trim() ?? "") !== "true") {
    throw new Error("LEGAL_DOCUMENT_APPROVED must be true after real legal approval.");
  }

  const legalDocumentVersion = requiredValue(environment, "LEGAL_DOCUMENT_VERSION");
  if (!versionPattern.test(legalDocumentVersion) || unsafeLegalVersionPattern.test(legalDocumentVersion)) {
    throw new Error("LEGAL_DOCUMENT_VERSION must be an approved, non-draft production version.");
  }

  const legalEffectiveDate = requiredValue(environment, "LEGAL_DOCUMENT_EFFECTIVE_DATE");
  if (!isIsoDate(legalEffectiveDate)) {
    throw new Error("LEGAL_DOCUMENT_EFFECTIVE_DATE must be a real ISO date in YYYY-MM-DD format.");
  }

  const legalOperatorName = productionText(environment, "LEGAL_OPERATOR_NAME", 3);
  const legalOperatorAddress = productionText(environment, "LEGAL_OPERATOR_ADDRESS", 5);
  const legalOperatorEmail = requiredValue(environment, "LEGAL_OPERATOR_EMAIL");
  if (!emailPattern.test(legalOperatorEmail) || placeholderTextPattern.test(legalOperatorEmail)) {
    throw new Error("LEGAL_OPERATOR_EMAIL must be a real production contact email.");
  }

  const legalProcessors = requiredValue(environment, "LEGAL_PROCESSORS")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    legalProcessors.length === 0 ||
    legalProcessors.length > 12 ||
    legalProcessors.some((value) => value.length < 2 || placeholderTextPattern.test(value))
  ) {
    throw new Error("LEGAL_PROCESSORS must list 1-12 real production processors separated by semicolons.");
  }

  const releaseVersion = requiredValue(environment, "RELEASE_VERSION");
  if (!releasePattern.test(releaseVersion) || unsafeReleasePattern.test(releaseVersion)) {
    throw new Error("RELEASE_VERSION must be an immutable commit SHA or release tag.");
  }

  return Object.freeze({
    legalDocumentVersion,
    legalEffectiveDate,
    legalOperatorAddress,
    legalOperatorEmail,
    legalOperatorName,
    legalProcessors,
    publishableKey,
    releaseVersion,
    serviceRoleKey,
    siteOrigin,
    supabaseOrigin,
  });
}

function checkResult(name, details) {
  return { details, name, status: "ok" };
}

function databaseError(result, checkName) {
  if (result.error) {
    const code = typeof result.error.code === "string" ? result.error.code : "unknown";
    throw new Error(`${checkName} failed with database error code ${code}.`);
  }
}

async function fetchResponse(fetchImpl, url, init, checkName) {
  let response;

  try {
    response = await fetchImpl(url, {
      ...init,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error(`${checkName} could not reach its configured endpoint.`);
  }

  if (!response.ok) {
    throw new Error(`${checkName} returned HTTP ${response.status}.`);
  }

  return response;
}

function requirePageContent(html, fragments, checkName) {
  const escapedFragment = (fragment) => fragment
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const missing = fragments.find((fragment) => (
    !html.includes(fragment) && !html.includes(escapedFragment(fragment))
  ));
  if (missing) {
    throw new Error(`${checkName} does not contain the approved runtime content.`);
  }

  if (html.includes("Регистрация временно закрыта") || html.includes("Черновик для разработки")) {
    throw new Error(`${checkName} is still rendering a blocked or draft state.`);
  }
}

export async function runProductionPreflight({
  adminClient,
  config,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  publicClient,
}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("A Fetch-compatible implementation is required.");
  }

  const checks = [];
  const appHealth = await fetchResponse(fetchImpl, `${config.siteOrigin}/healthz`, {}, "Application health");
  let appHealthBody;

  try {
    appHealthBody = await appHealth.json();
  } catch {
    throw new Error("Application health returned invalid JSON.");
  }

  if (appHealthBody?.status !== "ok") {
    throw new Error("Application health did not report status=ok.");
  }
  checks.push(checkResult("application_liveness", "GET /healthz reported status=ok"));

  await fetchResponse(
    fetchImpl,
    `${config.supabaseOrigin}/auth/v1/health`,
    {
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
      },
    },
    "Supabase Auth health",
  );
  checks.push(checkResult("supabase_auth", "Auth health endpoint is reachable"));

  for (const [path, name] of [["/legal/privacy", "privacy_document"], ["/legal/consent", "consent_document"]]) {
    const response = await fetchResponse(fetchImpl, `${config.siteOrigin}${path}`, {}, name);
    const html = await response.text();
    const effectiveDateLabel = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" })
      .format(new Date(`${config.legalEffectiveDate}T00:00:00.000Z`));
    requirePageContent(
      html,
      [
        config.legalDocumentVersion,
        effectiveDateLabel,
        config.legalOperatorAddress,
        config.legalOperatorName,
        config.legalOperatorEmail,
        ...config.legalProcessors,
      ],
      name,
    );
    checks.push(checkResult(name, `${path} renders the approved operator and document version`));
  }

  const signUpResponse = await fetchResponse(fetchImpl, `${config.siteOrigin}/auth/sign-up`, {}, "Signup page");
  const signUpHtml = await signUpResponse.text();
  requirePageContent(signUpHtml, ["Код приглашения", config.legalDocumentVersion], "Signup page");
  checks.push(checkResult("closed_beta_signup", "Signup renders the invitation and approved-consent gates"));

  const legalResult = await adminClient
    .from("legal_document_versions")
    .select("version,effective_date,is_active")
    .eq("is_active", true)
    .limit(2);
  databaseError(legalResult, "Active legal version");

  if (
    !Array.isArray(legalResult.data) ||
    legalResult.data.length !== 1 ||
    legalResult.data[0]?.version !== config.legalDocumentVersion ||
    legalResult.data[0]?.effective_date !== config.legalEffectiveDate
  ) {
    throw new Error("The active database legal version does not exactly match the approved runtime version and date.");
  }
  checks.push(checkResult("active_legal_version", "Database and runtime legal versions match exactly"));

  const invitationResult = await adminClient
    .from("beta_invitations")
    .select("id", { count: "exact", head: true });
  databaseError(invitationResult, "Invitation store");
  if (typeof invitationResult.count !== "number") {
    throw new Error("Invitation store did not return a readable row count.");
  }
  checks.push(checkResult("invitation_store", `Invitation table is readable; ${invitationResult.count} row(s) recorded`));

  const invitationProbe = await publicClient.rpc("is_beta_invitation_valid", {
    candidate_email: "production-preflight@never-match.invalid",
    candidate_hash: "0".repeat(64),
    candidate_role: "founder",
  });
  databaseError(invitationProbe, "Public invitation probe");
  if (invitationProbe.data !== false) {
    throw new Error("The impossible public invitation probe was not rejected.");
  }
  checks.push(checkResult("public_invitation_probe", "Anonymous validation RPC rejected an impossible invitation"));

  return {
    checked_at: now().toISOString(),
    checks,
    legal_document_version: config.legalDocumentVersion,
    release_version: config.releaseVersion,
    target: {
      app: config.siteOrigin,
      supabase: config.supabaseOrigin,
    },
  };
}
