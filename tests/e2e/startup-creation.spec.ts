import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { Database } from "../../lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const legalMetadata = {
  legal_consent: true,
  legal_document_version: "local-development-v1",
};

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
      user_metadata: { full_name: "Playwright Founder", role: "founder", ...legalMetadata },
    });

    expect(error).toBeNull();
    expect(data.user).not.toBeNull();
    userId = data.user?.id;

    await page.goto("/auth/login");
    await page.getByLabel("Электронная почта").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/protected");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole("link", { name: "Опубликовать стартап" }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/startups\/new$/);

    await page.getByLabel("Название стартапа").fill(startupTitle);
    await page.getByLabel("Адрес страницы").fill(slug);
    await page.locator("#stage").selectOption("mvp");
    await page
      .getByLabel("Краткое описание")
      .fill("Actionable climate analytics for logistics teams.");
    await page
      .getByLabel("Подробное описание")
      .fill(
        "A decision-support platform that helps logistics teams model emissions, compare routes, and reduce operating costs.",
      );
    await page.getByLabel("Ниши").fill("ClimateTech, B2B SaaS");
    await page.getByLabel("Требуемая сумма (₽)").fill("250000");
    await page.getByLabel("Предлагаемая доля (%)").fill("8");
    await page.getByLabel("Сайт проекта").fill("https://example.com");
    await page.getByRole("button", { name: "Опубликовать стартап" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(startupTitle, { exact: true })).toBeVisible();
    await expect(page.getByText("Actionable climate analytics for logistics teams.")).toBeVisible();

    const startupCard = page.getByRole("article", { name: startupTitle });
    await startupCard.getByRole("link", { name: "Редактировать" }).click();
    await expect(page).toHaveURL(/\/dashboard\/startups\/\d+\/edit$/);
    await page.locator("#edit-one_pager").fill(updatedSummary);
    await page.getByRole("button", { name: "Сохранить изменения" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(startupCard.getByText(updatedSummary, { exact: true })).toBeVisible();

    await startupCard.getByRole("button", { name: "Снять с публикации" }).click();
    await expect(startupCard.getByText("Неактивен", { exact: true })).toBeVisible();
    await expect(startupCard.getByRole("link", { name: "Открыть публичную страницу" })).toHaveCount(0);

    await startupCard.getByRole("button", { name: "Опубликовать снова" }).click();
    await expect(startupCard.getByText("Активен", { exact: true })).toBeVisible();

    await startupCard.getByRole("link", { name: "Открыть публичную страницу" }).click();
    await expect(page).toHaveURL(new RegExp(`/startups/${slug}$`));
    const publicHeading = page.getByRole("heading", { level: 1, name: startupTitle });
    await expect(publicHeading).toBeVisible();
    await expect(publicHeading.locator("..").getByText(updatedSummary, { exact: true })).toBeVisible();
    await expect(page.getByText(/250\s000\s₽/u)).toBeVisible();

    await page.getByRole("link", { name: "Все стартапы" }).click();
    await expect(page).toHaveURL(/\/startups$/);
    await expect(page.getByRole("link", { name: startupTitle })).toBeVisible();

    await page.locator("#directory-stage").selectOption("mvp");
    await page.locator("#directory-niche").fill("ClimateTech");
    await page.getByRole("button", { name: "Применить фильтры" }).click();
    await expect(page).toHaveURL(/stage=mvp/);
    await expect(page).toHaveURL(/niche=ClimateTech/);
    await expect(page.getByRole("link", { name: startupTitle })).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Смотреть стартапы" })).toHaveAttribute(
      "href",
      "/startups",
    );

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
