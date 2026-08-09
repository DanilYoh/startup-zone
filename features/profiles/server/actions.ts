"use server";

import {
  parseProfileContactForm,
  parseProfileForm,
  type ProfileContactInput,
  type ProfileInput,
} from "@/features/profiles/schemas";
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

export type ProfileContactActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof ProfileContactInput, string[]>>;
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
      message: "Проверьте выделенные поля и повторите попытку.",
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
    return { status: "error", message: "Не удалось проверить профиль. Повторите попытку." };
  }

  if (currentProfile?.role !== "founder" && currentProfile?.role !== "investor") {
    return { status: "error", message: "У этой учётной записи больше нет активной роли на площадке." };
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
      message: "Не удалось сохранить профиль. Повторите попытку.",
    };
  }

  if (!profile) {
    return {
      status: "error",
      message: "Профиль не найден. Если ошибка повторяется, выйдите из аккаунта и обратитесь в поддержку.",
    };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Профиль сохранён.",
  };
}

export async function updateProfileContact(
  _previousState: ProfileContactActionState,
  formData: FormData,
): Promise<ProfileContactActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const validated = parseProfileContactForm(formData);
  if (!validated.success) {
    return {
      status: "error",
      message: "Проверьте выделенные поля контактов и повторите попытку.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    await logRequestError("profile.contact_authorization_failed", { code: profileError.code });
    return { status: "error", message: "Не удалось проверить профиль. Повторите попытку." };
  }

  if (currentProfile?.role !== "founder" && currentProfile?.role !== "investor") {
    return { status: "error", message: "У этой учётной записи больше нет активной роли на площадке." };
  }

  const { data: contact, error } = await supabase
    .from("profile_contacts")
    .update({
      contact_email: validated.data.contact_email,
      contact_url: validated.data.contact_url,
      sharing_enabled: validated.data.sharing_enabled,
    })
    .eq("profile_id", user.id)
    .select("profile_id")
    .maybeSingle();

  if (error) {
    await logRequestError("profile.contact_update_failed", { code: error.code });
    return {
      status: "error",
      message: "Не удалось сохранить приватный контакт. Повторите попытку.",
    };
  }

  if (!contact) {
    return {
      status: "error",
      message: "Запись с приватным контактом не найдена. Если ошибка повторяется, обратитесь в поддержку.",
    };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/applications/inbox");

  return {
    status: "success",
    message: validated.data.sharing_enabled
      ? "Обмен контактами после принятия заявки включён."
      : "Приватный контакт сохранён без передачи другим участникам.",
  };
}
