"use server";

import {
  parseApplicationForm,
  type ApplicationInput,
} from "@/features/applications/schemas";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationType, TablesInsert } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ApplicationActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof ApplicationInput, string[]>>;
};

export async function createApplication(
  _previousState: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const validated = parseApplicationForm(formData);
  if (!validated.success) {
    return {
      status: "error",
      message: "Review the message and try again.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const [{ data: profile, error: profileError }, { data: startup, error: startupError }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("startups")
        .select("id, founder_id, is_active")
        .eq("id", validated.data.startup_id)
        .maybeSingle(),
    ]);

  if (profileError || startupError) {
    console.error("Unable to authorize application submission", {
      profileCode: profileError?.code,
      startupCode: startupError?.code,
    });
    return { status: "error", message: "Could not verify this opportunity. Try again." };
  }

  const type: ApplicationType | null =
    profile?.role === "specialist"
      ? "team"
      : profile?.role === "investor"
        ? "investor"
        : null;

  if (!type) {
    return { status: "error", message: "Only specialists and investors can send applications." };
  }

  if (!startup || !startup.is_active) {
    return { status: "error", message: "This startup is no longer accepting applications." };
  }

  if (startup.founder_id === user.id) {
    return { status: "error", message: "You cannot apply to your own startup." };
  }

  const application: TablesInsert<"applications"> = {
    startup_id: startup.id,
    applicant_id: user.id,
    type,
    message: validated.data.message,
  };

  const { error } = await supabase.from("applications").insert(application);
  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "You already sent this application." };
    }

    console.error("Unable to create application", { code: error.code });
    return { status: "error", message: "Could not send the application. Please try again." };
  }

  revalidatePath("/dashboard/applications");
  revalidatePath("/startups");
  return {
    status: "success",
    message: type === "team" ? "Application sent to the founder." : "Interest sent to the founder.",
  };
}

