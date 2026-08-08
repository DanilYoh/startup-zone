import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { ApplicationType, Database, UserRole } from "../../lib/supabase/types";

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

const applicantRoles: ReadonlyArray<{
  role: Extract<UserRole, "specialist" | "investor">;
  type: ApplicationType;
  fieldLabel: string;
  buttonLabel: string;
}> = [
  {
    role: "specialist",
    type: "team",
    fieldLabel: "Message to the founder",
    buttonLabel: "Send application",
  },
  {
    role: "investor",
    type: "investor",
    fieldLabel: "Investment interest",
    buttonLabel: "Send interest",
  },
];

for (const scenario of applicantRoles) {
  test(`a ${scenario.role} submits and tracks an application`, async ({ page }) => {
    const suffix = randomUUID();
    const founderEmail = `founder-app-${suffix}@example.test`;
    const applicantEmail = `${scenario.role}-app-${suffix}@example.test`;
    const password = `Test-${suffix}-password`;
    const slug = `application-startup-${suffix.slice(0, 8)}`;
    const title = `Application Startup ${suffix.slice(0, 8)}`;
    const message = `I am a ${scenario.role} with relevant marketplace experience and would like to discuss this project.`;
    let founderId: string | undefined;
    let applicantId: string | undefined;

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

      const { data: applicant, error: applicantError } = await admin.auth.admin.createUser({
        email: applicantEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: `Application ${scenario.role}`, role: scenario.role },
      });
      expect(applicantError).toBeNull();
      applicantId = applicant.user?.id;
      if (!applicantId) throw new Error("Applicant fixture was not created");

      const { error: startupError } = await admin.from("startups").insert({
        founder_id: founderId,
        title,
        slug,
        one_pager: "A marketplace project ready for focused applications.",
        description:
          "A detailed marketplace project description that provides enough context for specialists and investors to respond.",
        stage: "mvp",
        niche: ["Marketplace"],
      });
      expect(startupError).toBeNull();

      await page.goto("/auth/login");
      await page.getByLabel("Email").fill(applicantEmail);
      await page.locator("#password").fill(password);
      await page.getByRole("button", { name: "Login" }).click();
      await expect(page).toHaveURL(/\/dashboard$/);

      await page.goto(`/startups/${slug}`);
      await page.getByLabel(scenario.fieldLabel).fill(message);
      await page.getByRole("button", { name: scenario.buttonLabel }).click();
      await expect(
        page.getByText(
          scenario.role === "specialist"
            ? "You already sent this application."
            : "You already sent this interest request.",
          { exact: true },
        ),
      ).toBeVisible();
      await expect(page.getByText("Pending", { exact: true })).toBeVisible();

      await page.goto("/dashboard/applications");
      await expect(page.getByRole("heading", { level: 1, name: "My applications" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
      await expect(page.getByText(message, { exact: true })).toBeVisible();
      await expect(page.getByText("Pending", { exact: true })).toBeVisible();

      const { data: application, error: applicationError } = await admin
        .from("applications")
        .select("applicant_id, type, status, message")
        .eq("applicant_id", applicantId)
        .single();

      expect(applicationError).toBeNull();
      expect(application).toEqual({
        applicant_id: applicantId,
        type: scenario.type,
        status: "pending",
        message,
      });
    } finally {
      if (applicantId) await admin.auth.admin.deleteUser(applicantId);
      if (founderId) await admin.auth.admin.deleteUser(founderId);
    }
  });
}
