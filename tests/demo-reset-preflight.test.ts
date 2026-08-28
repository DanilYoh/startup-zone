import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const completeEnvironment = {
  DEMO_SEED_PROJECT_REF: "demo-project",
  LEGAL_DOCUMENT_VERSION: "demo-v1",
  NEXT_PUBLIC_SUPABASE_URL: "https://demo-project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  DEMO_FOUNDER_EMAIL: "founder@example.test",
  DEMO_FOUNDER_PASSWORD: "founder-password",
  DEMO_INVESTOR_EMAIL: "investor@example.test",
  DEMO_INVESTOR_PASSWORD: "investor-password",
};

const requiredNames = Object.keys(
  completeEnvironment,
) as (keyof typeof completeEnvironment)[];

function runPreflight(missingName?: keyof typeof completeEnvironment) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "demo-reset-preflight-"));
  const githubOutput = join(temporaryDirectory, "github-output.txt");
  const environment = {
    ...process.env,
    ...completeEnvironment,
    GITHUB_OUTPUT: githubOutput,
  };

  if (missingName) delete environment[missingName];

  try {
    const result = spawnSync(
      process.execPath,
      ["scripts/demo-reset-preflight.mjs"],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: environment,
      },
    );

    return {
      githubOutput: readFileSync(githubOutput, "utf8"),
      result,
    };
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
}

describe("demo reset preflight", () => {
  it.each(requiredNames)(
    "fails closed when %s is absent",
    (missingName) => {
      const { githubOutput, result } = runPreflight(missingName);
      const output = `${result.stdout}${result.stderr}`.trim();

      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(githubOutput).toBe("configured=false\n");
      expect(output).toBe(
        `::error::Demo reset configuration is incomplete. Missing GitHub Demo configuration: ${missingName}.`,
      );

      for (const value of Object.values(completeEnvironment)) {
        expect(output).not.toContain(value);
      }
    },
  );

  it("succeeds without logging secret values when configuration is complete", () => {
    const { githubOutput, result } = runPreflight();
    const output = `${result.stdout}${result.stderr}`;

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(githubOutput).toBe("configured=true\n");
    expect(output).toContain("Demo reset configuration is complete.");

    for (const value of [
      completeEnvironment.SUPABASE_SERVICE_ROLE_KEY,
      completeEnvironment.DEMO_FOUNDER_PASSWORD,
      completeEnvironment.DEMO_INVESTOR_PASSWORD,
    ]) {
      expect(output).not.toContain(value);
    }
  });
});
