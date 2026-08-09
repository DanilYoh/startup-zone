import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { Database } from "../../lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Moderation E2E tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from a local or test Supabase instance.",
  );
}

const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

test("a founder accepts a pending application to their startup", async ({ page }) => {
  const suffix = randomUUID();
  const founderEmail = `moderation-founder-${suffix}@example.test`;
  const investorEmail = `moderation-investor-${suffix}@example.test`;
  const password = `Test-${suffix}-password`;
  const title = `Moderation Startup ${suffix.slice(0, 8)}`;
  const slug = `moderation-startup-${suffix.slice(0, 8)}`;
  const message = "This marketplace fits my seed thesis and I would like to discuss the current round.";
  let founderId: string | undefined;
  let investorId: string | undefined;
  let applicationId: number | undefined;

  try {
    const { data: founder, error: founderError } = await admin.auth.admin.createUser({
      email: founderEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Moderation Founder", role: "founder" },
    });
    expect(founderError).toBeNull();
    founderId = founder.user?.id;
    if (!founderId) throw new Error("Founder fixture was not created");

    const { data: investor, error: investorError } = await admin.auth.admin.createUser({
      email: investorEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Seed Investor", role: "investor" },
    });
    expect(investorError).toBeNull();
    investorId = investor.user?.id;
    if (!investorId) throw new Error("Investor fixture was not created");

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        bio: "Seed investor focused on capital-efficient marketplace businesses.",
        location: "Yekaterinburg",
        linkedin_url: "https://www.linkedin.com/in/seed-investor",
      })
      .eq("id", investorId);
    expect(profileError).toBeNull();

    const { data: startup, error: startupError } = await admin
      .from("startups")
      .insert({
        founder_id: founderId,
        title,
        slug,
        one_pager: "A startup with a pending investor interest request.",
        description:
          "A detailed startup description created to verify that founders can safely moderate pending applications.",
        stage: "mvp",
        niche: ["Marketplace"],
      })
      .select("id")
      .single();
    expect(startupError).toBeNull();
    if (!startup) throw new Error("Startup fixture was not created");

    const { data: application, error: applicationError } = await admin
      .from("applications")
      .insert({
        startup_id: startup.id,
        applicant_id: investorId,
        type: "investor",
        message,
      })
      .select("id")
      .single();
    expect(applicationError).toBeNull();
    applicationId = application?.id;
    if (!applicationId) throw new Error("Application fixture was not created");

    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(founderEmail);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/dashboard/applications/inbox");
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Seed Investor" })).toBeVisible();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(page.getByText("Yekaterinburg", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "Accept" }).click();
    await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).toHaveCount(0);

    const { data: persisted, error: persistedError } = await admin
      .from("applications")
      .select("status, message")
      .eq("id", applicationId)
      .single();

    expect(persistedError).toBeNull();
    expect(persisted).toEqual({ status: "accepted", message });
  } finally {
    if (investorId) await admin.auth.admin.deleteUser(investorId);
    if (founderId) await admin.auth.admin.deleteUser(founderId);
  }
});
