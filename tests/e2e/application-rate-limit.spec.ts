import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { Database, TablesInsert } from "../../lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Application rate-limit E2E tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from a local or test Supabase instance.",
  );
}

const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

test("concurrent application submissions share the per-applicant hourly limit", async () => {
  const suffix = randomUUID();
  const password = `Test-${suffix}-password`;
  let founderId: string | undefined;
  let applicantId: string | undefined;

  try {
    const { data: founder, error: founderError } = await admin.auth.admin.createUser({
      email: `rate-founder-${suffix}@example.test`,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Rate Limit Founder", role: "founder" },
    });
    expect(founderError).toBeNull();
    const createdFounderId = founder.user?.id;
    if (!createdFounderId) throw new Error("Rate-limit founder fixture was not created");
    founderId = createdFounderId;

    const { data: applicant, error: applicantError } = await admin.auth.admin.createUser({
      email: `rate-applicant-${suffix}@example.test`,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Rate Limit Investor", role: "investor" },
    });
    expect(applicantError).toBeNull();
    const createdApplicantId = applicant.user?.id;
    if (!createdApplicantId) throw new Error("Rate-limit applicant fixture was not created");
    applicantId = createdApplicantId;

    const startups: TablesInsert<"startups">[] = Array.from({ length: 21 }, (_, index) => ({
      founder_id: createdFounderId,
      title: `Concurrent Rate Startup ${index + 1}`,
      slug: `concurrent-rate-${suffix.slice(0, 8)}-${index + 1}`,
      one_pager: "An active startup used to test concurrent application limits.",
      description:
        "A detailed active startup description used to verify serialized database rate-limit checks.",
      stage: "idea",
      niche: ["Marketplace"],
    }));

    const { data: persistedStartups, error: startupsError } = await admin
      .from("startups")
      .insert(startups)
      .select("id");
    expect(startupsError).toBeNull();
    expect(persistedStartups).toHaveLength(21);

    const results = await Promise.all(
      (persistedStartups ?? []).map(({ id }) =>
        admin.from("applications").insert({
          startup_id: id,
          applicant_id: createdApplicantId,
          type: "investor",
          message: "A valid concurrent application message for this startup.",
        }),
      ),
    );

    const successful = results.filter(({ error }) => error === null);
    const rateLimited = results.filter(({ error }) => error?.code === "P0001");
    const unexpected = results.filter(
      ({ error }) => error !== null && error.code !== "P0001",
    );

    expect(successful).toHaveLength(20);
    expect(rateLimited).toHaveLength(1);
    expect(unexpected).toHaveLength(0);
  } finally {
    if (applicantId) await admin.auth.admin.deleteUser(applicantId);
    if (founderId) await admin.auth.admin.deleteUser(founderId);
  }
});
