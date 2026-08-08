"use server";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";
import { parseStartupForm } from "@/lib/startup-form";
import type { StartupInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type StartupActionState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<keyof StartupInput, string[]>>;
};

export async function createStartup(
  _previousState: StartupActionState,
  formData: FormData,
): Promise<StartupActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const validated = parseStartupForm(formData);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to authorize startup creation", { code: profileError.code });
    return {
      status: "error",
      message: "Could not verify your founder profile. Please try again.",
    };
  }

  if (profile?.role !== "founder") {
    return {
      status: "error",
      message: "Only founder profiles can publish startups.",
    };
  }

  if (!validated.success) {
    return {
      status: "error",
      message: "Review the highlighted fields and try again.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const startup: TablesInsert<"startups"> = {
    founder_id: user.id,
    ...validated.data,
    deck_url: validated.data.deck_url ?? null,
    website_url: validated.data.website_url ?? null,
  };

  const { error } = await supabase.from("startups").insert(startup);

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Choose a different slug and try again.",
        errors: { slug: ["This slug is already in use"] },
      };
    }

    console.error("Unable to create startup", { code: error.code });
    return {
      status: "error",
      message: "Could not create the startup. Please try again.",
    };
  }

  revalidatePath("/protected");
  redirect("/protected");
}
