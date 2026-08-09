import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const seedScript = fileURLToPath(new URL("../scripts/seed-demo.mjs", import.meta.url));

function runSeed(environment: Record<string, string>) {
  return spawnSync(process.execPath, [seedScript], {
    encoding: "utf8",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-only-placeholder",
      ...environment,
    },
  });
}

describe("demo seed safeguards", () => {
  it("requires explicit write authorization before contacting Supabase", () => {
    const result = runSeed({
      APP_ENVIRONMENT: "test",
      ALLOW_DEMO_SEED: "false",
      DEMO_SEED_PROJECT_REF: "test-project",
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("ALLOW_DEMO_SEED=true");
  });

  it("blocks production even when the write flag and project ref are supplied", () => {
    const result = runSeed({
      APP_ENVIRONMENT: "production",
      ALLOW_DEMO_SEED: "true",
      DEMO_SEED_PROJECT_REF: "test-project",
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Production seeding is blocked");
  });

  it("rejects a configured project ref that does not match the target URL", () => {
    const result = runSeed({
      APP_ENVIRONMENT: "demo",
      ALLOW_DEMO_SEED: "true",
      DEMO_SEED_PROJECT_REF: "different-project",
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Demo seed target mismatch");
  });
});
