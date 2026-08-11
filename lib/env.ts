import { z } from "zod";

const environmentNames = ["local", "test", "demo", "production"] as const;
const vercelEnvironmentNames = ["development", "preview", "production"] as const;
type Environment = Readonly<Record<string, string | undefined>>;

const httpUrl = z.url().refine(
  (value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  },
  "must use HTTP or HTTPS",
);

const httpsUrl = z.url().refine(
  (value) => new URL(value).protocol === "https:",
  "must use HTTPS",
);

export const productionEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: httpsUrl,
  NEXT_PUBLIC_SUPABASE_URL: httpsUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
  RELEASE_VERSION: z.string().trim().min(1),
});

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: httpUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
});

const demoEnvSchema = z.object({
  APP_ENVIRONMENT: z.literal("demo"),
  DEMO_READ_ONLY_ENABLED: z.literal("true"),
});

function issueNames(error: z.ZodError) {
  return [...new Set(error.issues.map((issue) => issue.path.join(".") || "environment"))]
    .sort()
    .join(", ");
}

export function isProductionRuntime(environment: Environment = process.env) {
  if (vercelEnvironmentNames.some((name) => environment.VERCEL_ENV === name)) {
    return environment.VERCEL_ENV === "production";
  }
  if (environment.APP_ENVIRONMENT === "production") return true;
  if (environmentNames.some((name) => environment.APP_ENVIRONMENT === name)) return false;
  return environment.NODE_ENV === "production";
}

export function validateProductionEnv(environment: Environment = process.env) {
  if (!isProductionRuntime(environment)) return null;

  const parsed = productionEnvSchema.safeParse({
    ...environment,
    RELEASE_VERSION:
      environment.RELEASE_VERSION?.trim() || environment.VERCEL_GIT_COMMIT_SHA?.trim(),
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid production environment. Check required variables: ${issueNames(parsed.error)}.`,
    );
  }

  return parsed.data;
}

export function hasSupabaseConfiguration(environment: Environment = process.env) {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url && !key) return false;

  const parsed = supabaseEnvSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error(
      `Invalid Supabase environment. Check required variables: ${issueNames(parsed.error)}.`,
    );
  }

  return true;
}

export function getSupabaseEnv(environment: Environment = process.env) {
  const parsed = supabaseEnvSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error(
      `Invalid Supabase environment. Check required variables: ${issueNames(parsed.error)}.`,
    );
  }
  return parsed.data;
}

export function getSiteOrigin(environment: Environment = process.env) {
  const production = validateProductionEnv(environment);
  if (production) return new URL(production.NEXT_PUBLIC_SITE_URL).origin;

  const configured = httpUrl.safeParse(environment.NEXT_PUBLIC_SITE_URL);
  if (configured.success) return new URL(configured.data).origin;

  if (environment.VERCEL_URL) {
    const vercel = httpsUrl.safeParse(`https://${environment.VERCEL_URL}`);
    if (vercel.success) return new URL(vercel.data).origin;
  }

  return "http://localhost:3000";
}

export function isReadOnlyDemoEnabled(environment: Environment = process.env) {
  if (environment.DEMO_READ_ONLY_ENABLED !== "true") return false;

  const parsed = demoEnvSchema.safeParse(environment);
  if (!parsed.success) {
    throw new Error(
      `Invalid read-only demo environment. Check required variables: ${issueNames(parsed.error)}.`,
    );
  }
  return true;
}
