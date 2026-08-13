import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { startupSchema } from "../lib/validations";
import { demoStartups } from "../scripts/demo-startups.mjs";

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

describe("demo startup catalog", () => {
  it("contains 15 valid synthetic startups", () => {
    expect(demoStartups).toHaveLength(15);

    for (const startup of demoStartups) {
      expect(startupSchema.safeParse(startup).success, startup.slug).toBe(true);
    }
  });

  it("keeps unique slugs and the application workflow fixtures", () => {
    const slugs = demoStartups.map((startup) => startup.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "flowpilot-operations-ai",
        "greenledger-climate-reporting",
        "carebridge-remote-care",
      ]),
    );
  });

  it("covers a varied set of stages and niches", () => {
    const stages = new Set(demoStartups.map((startup) => startup.stage));
    const niches = new Set(demoStartups.flatMap((startup) => startup.niche));

    expect(stages.size).toBeGreaterThanOrEqual(5);
    expect(niches.size).toBeGreaterThanOrEqual(20);
  });
});
