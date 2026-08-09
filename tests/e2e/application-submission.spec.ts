import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { Database } from "../../lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Application E2E tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from a local or test Supabase instance.",
  );
}

const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

test("an investor submits and tracks investment interest", async ({ page }) => {
  const suffix = randomUUID();
  const founderEmail = `founder-app-${suffix}@example.test`;
  const investorEmail = `investor-app-${suffix}@example.test`;
  const password = `Test-${suffix}-password`;
  const slug = `application-startup-${suffix.slice(0, 8)}`;
  const title = `Application Startup ${suffix.slice(0, 8)}`;
  const message = "This company fits my seed-stage marketplace thesis and I would like to meet the founder.";
  let founderId: string | undefined;
  let investorId: string | undefined;

  try {
    const { data: founder, error: founderError } = await admin.auth.admin.createUser({
      email: founderEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Application Founder", role: "founder" },
    });
    expect(founderError).toBeNull();
    founderId = founder.user?.id;
    if (!founderId) throw new Error("Founder fixture was not created");

    const { data: investor, error: investorError } = await admin.auth.admin.createUser({
      email: investorEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Application Investor", role: "investor" },
    });
    expect(investorError).toBeNull();
    investorId = investor.user?.id;
    if (!investorId) throw new Error("Investor fixture was not created");

    const { error: startupError } = await admin.from("startups").insert({
      founder_id: founderId,
      title,
      slug,
      one_pager: "A marketplace project ready for focused investor interest.",
      description:
        "A detailed marketplace project description that provides enough context for investors to qualify the opportunity.",
      stage: "mvp",
      niche: ["Marketplace"],
    });
    expect(startupError).toBeNull();

    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(investorEmail);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/startups/${slug}`);
    await page.getByLabel("Investment interest").fill(message);
    await page.getByRole("button", { name: "Send interest" }).click();
    await expect(page.getByText("You already sent this interest request.", { exact: true })).toBeVisible();
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();

    await page.goto("/dashboard/applications");
    await expect(page.getByRole("heading", { level: 1, name: "My investment interest" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
    await expect(page.getByText(message, { exact: true })).toBeVisible();

    const { data: application, error: applicationError } = await admin
      .from("applications")
      .select("applicant_id, type, status, message")
      .eq("applicant_id", investorId)
      .single();

    expect(applicationError).toBeNull();
    expect(application).toEqual({
      applicant_id: investorId,
      type: "investor",
      status: "pending",
      message,
    });
  } finally {
    if (investorId) await admin.auth.admin.deleteUser(investorId);
    if (founderId) await admin.auth.admin.deleteUser(founderId);
  }
});
