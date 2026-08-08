"use server";

import { createClient } from "@/lib/supabase/server";
import { startupSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type StartupActionError = {
  error: Record<string, string[] | undefined> | { message: string };
};

function optionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return Number(value);
}

function parseNiches(formData: FormData) {
  const values = formData
    .getAll("niche")
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) => {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : value.split(",");
      } catch {
        return value.split(",");
      }
    });

  return values.map(String).map((value) => value.trim()).filter(Boolean);
}

export async function createStartup(formData: FormData): Promise<StartupActionError | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const validated = startupSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    one_pager: formData.get("one_pager"),
    description: formData.get("description"),
    stage: formData.get("stage"),
    niche: parseNiches(formData),
    funding_ask: optionalNumber(formData.get("funding_ask")),
    equity_offered: optionalNumber(formData.get("equity_offered")),
    deck_url: formData.get("deck_url"),
    website_url: formData.get("website_url"),
  });

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("startups").insert({
    founder_id: user.id,
    ...validated.data,
  });

  if (error) {
    return { error: { message: "Could not create the startup. Please try again." } };
  }

  revalidatePath("/protected");
  redirect("/protected");
}
