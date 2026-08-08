import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { UserRole, Database } from "../../lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "The profile onboarding E2E tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from a local or test Supabase instance.",
  );
}

const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const roles: ReadonlyArray<{ role: UserRole; label: string }> = [
  { role: "founder", label: "Founder" },
  { role: "specialist", label: "Specialist" },
  { role: "investor", label: "Investor" },
];

for (const { role, label } of roles) {
  test(`a new ${role} chooses a locked role and edits their profile`, async ({ page }) => {
    const suffix = randomUUID();
    const email = `${role}-${suffix}@example.com`;
    const password = `Test-${suffix}-password`;
    const initialName = `${label} Onboarding`;
    const updatedName = `${label} Profile`;
    let userId: string | undefined;

    try {
      await page.goto("/auth/sign-up");
      await page.getByLabel("Full name").fill(initialName);
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Role").selectOption(role);
      await page.locator("#password").fill(password);
      await page.locator("#repeat-password").fill(password);
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(page).toHaveURL(/\/dashboard\/profile$/);
      await expect(page.getByRole("heading", { level: 1, name: "Profile" })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Role" })).toHaveValue(label);

      const { data: users, error: usersError } = await admin.auth.admin.listUsers();
      expect(usersError).toBeNull();
      userId = users.users.find((user) => user.email === email)?.id;
      expect(userId).toBeDefined();
      if (!userId) throw new Error("The registered user could not be found");

      await page.locator("#profile-full-name").fill(updatedName);
      await page.getByLabel("Description").fill(`A verified ${role} marketplace profile.`);
      await page.getByLabel("Location").fill("Yekaterinburg");
      await page
        .getByLabel("Avatar URL")
        .fill(`https://images.example.test/${role}-${suffix}.png`);
      await page
        .getByLabel("LinkedIn URL")
        .fill(`https://www.linkedin.com/in/${role}-${suffix}`);
      await page.getByRole("button", { name: "Save profile" }).click();

      await expect(page.getByRole("status")).toHaveText("Profile saved.");

      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("role, full_name, bio, location, avatar_url, linkedin_url")
        .eq("id", userId)
        .single();

      expect(profileError).toBeNull();
      expect(profile).toEqual({
        role,
        full_name: updatedName,
        bio: `A verified ${role} marketplace profile.`,
        location: "Yekaterinburg",
        avatar_url: `https://images.example.test/${role}-${suffix}.png`,
        linkedin_url: `https://www.linkedin.com/in/${role}-${suffix}`,
      });
    } finally {
      if (userId) await admin.auth.admin.deleteUser(userId);
    }
  });
}
