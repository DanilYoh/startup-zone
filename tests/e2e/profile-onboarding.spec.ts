import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { passwordSchema } from "../../features/auth/schemas";
import type { MarketplaceRole } from "../../lib/domain-types";
import type { Database } from "../../lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
  throw new Error(
    "The profile onboarding E2E tests require NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY from a local or test Supabase instance.",
  );
}

const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const publicAuth = createClient<Database>(supabaseUrl, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const roles: ReadonlyArray<{ role: MarketplaceRole; label: string }> = [
  { role: "founder", label: "Основатель" },
  { role: "investor", label: "Инвестор" },
];

test("public Auth rejects passwords shorter than the shared policy", async () => {
  const email = `weak-password-${randomUUID()}@example.com`;
  const password = "Abc123";
  let userId: string | undefined;

  try {
    expect(passwordSchema.safeParse(password).success).toBe(false);

    const { data, error } = await publicAuth.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: "Weak Password", role: "founder" },
      },
    });
    userId = data.user?.id;

    expect(error).not.toBeNull();
    expect(error?.status).toBe(422);
    expect(data.user).toBeNull();
  } finally {
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});

for (const { role, label } of roles) {
  test(`a new ${role} chooses a locked role and edits their profile`, async ({ page }) => {
    const suffix = randomUUID();
    const email = `${role}-${suffix}@example.com`;
    const password = `Test-${suffix}-password`;
    const initialName = `${label} Onboarding`;
    const updatedName = `${label} Profile`;
    let userId: string | undefined;

    try {
      if (role === "founder") {
        await page.setViewportSize({ width: 390, height: 844 });
      }

      await page.goto("/auth/sign-up");
      await page.getByLabel("Имя и фамилия").fill(initialName);
      await page.getByLabel("Электронная почта").fill(email);
      await page.getByRole("radio", { name: label }).check();
      await page.locator("#password").fill(password);
      await page.locator("#repeat-password").fill(password);
      await page.getByRole("button", { name: "Создать аккаунт" }).click();

      await expect(page).toHaveURL(/\/dashboard\/profile$/);
      await expect(page.getByRole("heading", { level: 1, name: "Профиль" })).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Роль" })).toHaveValue(label);

      const { data: users, error: usersError } = await admin.auth.admin.listUsers();
      expect(usersError).toBeNull();
      userId = users.users.find((user) => user.email === email)?.id;
      expect(userId).toBeDefined();
      if (!userId) throw new Error("The registered user could not be found");

      await page.locator("#profile-full-name").fill(updatedName);
      await page.getByLabel("Профессиональный заголовок").fill(
        role === "founder" ? "Founder · Vertical software" : "Partner · Seed-stage B2B",
      );
      await page.getByLabel("О себе").fill(`A verified ${role} marketplace profile.`);
      await page.getByLabel("Город").fill("Yekaterinburg");
      await page
        .getByLabel("Ссылка на фотографию")
        .fill(`https://images.example.test/${role}-${suffix}.png`);
      await page
        .getByLabel("Ссылка на LinkedIn")
        .fill(`https://www.linkedin.com/in/${role}-${suffix}`);

      if (role === "founder") {
        await page.getByLabel("Релевантный опыт").fill(
          "Built and sold workflow software to regional operations teams.",
        );
      } else {
        await page.getByLabel("Фонд или организация").fill("Northstar Ventures");
        await page.getByLabel("Сайт организации").fill("https://northstar.example.test");
        await page.getByLabel("Инвестиционная стратегия").fill(
          "Backing capital-efficient B2B software at pre-seed and seed.",
        );
        await page.getByRole("checkbox", { name: "Pre-seed", exact: true }).check();
        await page.getByRole("checkbox", { name: "Seed", exact: true }).check();
        await page.getByLabel("Минимальный чек (₽)").fill("100000");
        await page.getByLabel("Максимальный чек (₽)").fill("500000");
      }
      await page.getByRole("button", { name: "Сохранить профиль" }).click();

      await expect(page.getByRole("status")).toHaveText("Профиль сохранён.");

      const contactUrl = `https://t.me/${role}_${suffix.replaceAll("-", "").slice(0, 20)}`;
      await page.getByLabel("Электронная почта для связи").fill(email);
      await page.getByLabel("Ссылка для связи").fill(contactUrl);
      await page
        .getByRole("checkbox", { name: "Показывать эти данные после того, как я приму заявку", exact: false })
        .check();
      await page.getByRole("button", { name: "Сохранить настройки контактов" }).click();
      await expect(page.getByText("Обмен контактами после принятия заявки включён.", { exact: true })).toBeVisible();

      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select(
          "role, full_name, headline, bio, location, avatar_url, linkedin_url, founder_experience, investor_organization, investment_thesis, preferred_stages, ticket_min, ticket_max, website_url",
        )
        .eq("id", userId)
        .single();

      expect(profileError).toBeNull();
      expect(profile).toMatchObject({
        role,
        full_name: updatedName,
        headline: role === "founder" ? "Founder · Vertical software" : "Partner · Seed-stage B2B",
        bio: `A verified ${role} marketplace profile.`,
        location: "Yekaterinburg",
        avatar_url: `https://images.example.test/${role}-${suffix}.png`,
        linkedin_url: `https://www.linkedin.com/in/${role}-${suffix}`,
        founder_experience:
          role === "founder"
            ? "Built and sold workflow software to regional operations teams."
            : null,
        investor_organization: role === "investor" ? "Northstar Ventures" : null,
        investment_thesis:
          role === "investor"
            ? "Backing capital-efficient B2B software at pre-seed and seed."
            : null,
        preferred_stages: role === "investor" ? ["pre_seed", "seed"] : [],
        ticket_min: role === "investor" ? 100_000 : null,
        ticket_max: role === "investor" ? 500_000 : null,
        website_url: role === "investor" ? "https://northstar.example.test" : null,
      });

      const { data: contact, error: contactError } = await admin
        .from("profile_contacts")
        .select("contact_email, contact_url, sharing_enabled")
        .eq("profile_id", userId)
        .single();

      expect(contactError).toBeNull();
      expect(contact).toEqual({
        contact_email: email,
        contact_url: contactUrl,
        sharing_enabled: true,
      });

      if (role === "founder") {
        const viewport = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
        await expect(page.getByRole("heading", { name: "Контакты после принятия заявки" })).toBeVisible();
      }
    } finally {
      if (userId) await admin.auth.admin.deleteUser(userId);
    }
  });
}
