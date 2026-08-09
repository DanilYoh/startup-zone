"use server";

import { parseProfileForm, type ProfileInput } from "@/features/profiles/schemas";
import { logRequestError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof ProfileInput, string[]>>;
};

export async function updateProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const validated = parseProfileForm(formData);

  if (!validated.success) {
    return {
      status: "error",
      message: "Review the highlighted fields and try again.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    await logRequestError("profile.authorization_failed", { code: profileError.code });
    return { status: "error", message: "Could not verify your profile. Please try again." };
  }

  if (currentProfile?.role !== "founder" && currentProfile?.role !== "investor") {
    return { status: "error", message: "This account no longer has an active marketplace role." };
  }

  const update: TablesUpdate<"profiles"> = {
    full_name: validated.data.full_name,
    headline: validated.data.headline,
    bio: validated.data.bio,
    location: validated.data.location,
    avatar_url: validated.data.avatar_url,
    linkedin_url: validated.data.linkedin_url,
    founder_experience:
      currentProfile.role === "founder" ? validated.data.founder_experience : null,
    investor_organization:
      currentProfile.role === "investor" ? validated.data.investor_organization : null,
    investment_thesis:
      currentProfile.role === "investor" ? validated.data.investment_thesis : null,
    preferred_stages:
      currentProfile.role === "investor" ? validated.data.preferred_stages : [],
    ticket_min: currentProfile.role === "investor" ? validated.data.ticket_min : null,
    ticket_max: currentProfile.role === "investor" ? validated.data.ticket_max : null,
    website_url: currentProfile.role === "investor" ? validated.data.website_url : null,
  };

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    await logRequestError("profile.update_failed", { code: error.code });
    return {
      status: "error",
      message: "Could not save your profile. Please try again.",
    };
  }

  if (!profile) {
    return {
      status: "error",
      message: "Your profile could not be found. Sign out and contact support if this continues.",
    };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Profile saved.",
  };
}
