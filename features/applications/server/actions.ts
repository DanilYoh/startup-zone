"use server";

import {
  parseApplicationForm,
  parseModerationForm,
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

export type ModerationActionState = {
  status: "idle" | "success" | "error";
  message?: string;
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

export async function moderateApplication(
  _previousState: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const validated = parseModerationForm(formData);
  if (!validated.success) {
    return { status: "error", message: "The requested decision is invalid." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to authorize application moderation", { code: profileError.code });
    return { status: "error", message: "Could not verify your founder profile. Try again." };
  }

  if (profile?.role !== "founder") {
    return { status: "error", message: "Only founders can decide applications." };
  }

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, status, startup:startups!applications_startup_id_fkey(founder_id)")
    .eq("id", validated.data.application_id)
    .maybeSingle();

  if (applicationError) {
    console.error("Unable to load application for moderation", { code: applicationError.code });
    return { status: "error", message: "Could not load the application. Try again." };
  }

  if (!application || application.startup.founder_id !== user.id) {
    return { status: "error", message: "Application not found or you cannot manage it." };
  }

  if (application.status !== "pending") {
    return { status: "error", message: "This application has already been decided." };
  }

  const { data: updated, error } = await supabase
    .from("applications")
    .update({ status: validated.data.decision })
    .eq("id", application.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to moderate application", { code: error.code });
    return { status: "error", message: "Could not save the decision. Please try again." };
  }

  if (!updated) {
    return { status: "error", message: "This application was already decided." };
  }

  revalidatePath("/dashboard/applications/inbox");
  revalidatePath("/dashboard/applications");
  return {
    status: "success",
    message: validated.data.decision === "accepted" ? "Application accepted." : "Application rejected.",
  };
}
