import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { Database } from "../../lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "The startup creation E2E test requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from a local or test Supabase instance.",
  );
}

const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

test("a founder publishes a startup that appears in public discovery", async ({ page }) => {
  const suffix = randomUUID();
  const email = `founder-${suffix}@example.test`;
  const password = `Test-${suffix}-password`;
  const startupTitle = `Climate Lens ${suffix.slice(0, 8)}`;
  const slug = `climate-lens-${suffix.slice(0, 8)}`;
  const updatedSummary = "Updated climate analytics for logistics operators.";
  let userId: string | undefined;

  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Playwright Founder", role: "founder" },
    });

    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
    userId = data.user?.id;

    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/protected");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("link", { name: "Publish startup" }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/startups\/new$/);

    await page.getByLabel("Startup name").fill(startupTitle);
    await page.getByLabel("Slug").fill(slug);
    await page.locator("#stage").selectOption("mvp");
    await page
      .getByLabel("One-line summary")
      .fill("Actionable climate analytics for logistics teams.");
    await page
      .getByLabel("Description")
      .fill(
        "A decision-support platform that helps logistics teams model emissions, compare routes, and reduce operating costs.",
      );
    await page.getByLabel("Niches").fill("ClimateTech, B2B SaaS");
    await page.getByLabel("Funding ask (USD)").fill("250000");
    await page.getByLabel("Equity offered (%)").fill("8");
    await page.getByLabel("Website URL").fill("https://example.com");
    await page.getByRole("button", { name: "Publish startup" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(startupTitle, { exact: true })).toBeVisible();
    await expect(page.getByText("Actionable climate analytics for logistics teams.")).toBeVisible();

    const startupCard = page.getByRole("article", { name: startupTitle });
    await startupCard.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/dashboard\/startups\/\d+\/edit$/);
    await page.locator("#edit-one_pager").fill(updatedSummary);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(startupCard.getByText(updatedSummary, { exact: true })).toBeVisible();

    await startupCard.getByRole("button", { name: "Deactivate" }).click();
    await expect(startupCard.getByText("Inactive", { exact: true })).toBeVisible();
    await expect(startupCard.getByRole("link", { name: "View public page" })).toHaveCount(0);

    await startupCard.getByRole("button", { name: "Republish" }).click();
    await expect(startupCard.getByText("Active", { exact: true })).toBeVisible();

    await startupCard.getByRole("link", { name: "View public page" }).click();
    await expect(page).toHaveURL(new RegExp(`/startups/${slug}$`));
    const publicHeading = page.getByRole("heading", { level: 1, name: startupTitle });
    await expect(publicHeading).toBeVisible();
    await expect(publicHeading.locator("..").getByText(updatedSummary, { exact: true })).toBeVisible();
    await expect(page.getByText("$250,000", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "All startups" }).click();
    await expect(page).toHaveURL(/\/startups$/);
    await expect(page.getByRole("link", { name: startupTitle })).toBeVisible();

    await page.locator("#directory-stage").selectOption("mvp");
    await page.locator("#directory-niche").fill("ClimateTech");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page).toHaveURL(/stage=mvp/);
    await expect(page).toHaveURL(/niche=ClimateTech/);
    await expect(page.getByRole("link", { name: startupTitle })).toBeVisible();

    const { data: persistedStartup, error: persistedStartupError } = await admin
      .from("startups")
      .select("founder_id, slug, niche")
      .eq("slug", slug)
      .single();

    expect(persistedStartupError).toBeNull();
    expect(persistedStartup).toEqual({
      founder_id: userId,
      slug,
      niche: ["ClimateTech", "B2B SaaS"],
    });
  } finally {
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});
