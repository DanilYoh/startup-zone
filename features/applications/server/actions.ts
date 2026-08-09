"use server";

import {
  parseApplicationForm,
  parseModerationForm,
  type ApplicationInput,
} from "@/features/applications/schemas";
import { createClient } from "@/lib/supabase/server";
import { logRequestError } from "@/lib/logger";
import type { TablesInsert } from "@/lib/supabase/types";
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
      message: "Проверьте сообщение и повторите попытку.",
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
    await logRequestError("application.authorization_failed", {
      profileCode: profileError?.code,
      startupCode: startupError?.code,
    });
    return { status: "error", message: "Не удалось проверить проект. Повторите попытку." };
  }

  if (profile?.role !== "investor") {
    return { status: "error", message: "Отправлять заявки могут только инвесторы." };
  }

  if (!startup || !startup.is_active) {
    return { status: "error", message: "Этот стартап больше не принимает заявки инвесторов." };
  }

  if (startup.founder_id === user.id) {
    return { status: "error", message: "Нельзя отправить заявку на собственный стартап." };
  }

  const application: TablesInsert<"applications"> = {
    startup_id: startup.id,
    applicant_id: user.id,
    type: "investor",
    message: validated.data.message,
  };

  const { error } = await supabase.from("applications").insert(application);
  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "Вы уже отправили заявку по этому стартапу." };
    }

    if (error.code === "P0001") {
      return {
        status: "error",
        message: "Достигнут лимит заявок. Подождите перед обращением к следующему стартапу.",
      };
    }

    await logRequestError("application.create_failed", { code: error.code });
    return { status: "error", message: "Не удалось отправить заявку. Повторите попытку." };
  }

  revalidatePath("/dashboard/applications");
  revalidatePath("/startups");
  return {
    status: "success",
    message: "Заявка отправлена основателю.",
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
    return { status: "error", message: "Выбранное решение недопустимо." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    await logRequestError("application.moderation_authorization_failed", { code: profileError.code });
    return { status: "error", message: "Не удалось проверить профиль основателя. Повторите попытку." };
  }

  if (profile?.role !== "founder") {
    return { status: "error", message: "Рассматривать заявки инвесторов могут только основатели." };
  }

  const { data: application, error: applicationError } = await supabase
    .from("applications")
    .select("id, status, startup:startups!applications_startup_id_fkey(founder_id)")
    .eq("id", validated.data.application_id)
    .maybeSingle();

  if (applicationError) {
    await logRequestError("application.moderation_read_failed", { code: applicationError.code });
    return { status: "error", message: "Не удалось загрузить заявку. Повторите попытку." };
  }

  if (!application || application.startup.founder_id !== user.id) {
    return { status: "error", message: "Заявка не найдена или у вас нет доступа к ней." };
  }

  if (application.status !== "pending") {
    return { status: "error", message: "По этой заявке уже принято решение." };
  }

  const { data: updated, error } = await supabase
    .from("applications")
    .update({ status: validated.data.decision })
    .eq("id", application.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    await logRequestError("application.moderation_write_failed", { code: error.code });
    return { status: "error", message: "Не удалось сохранить решение. Повторите попытку." };
  }

  if (!updated) {
    return { status: "error", message: "По этой заявке уже было принято решение." };
  }

  revalidatePath("/dashboard/applications/inbox");
  revalidatePath("/dashboard/applications");
  return {
    status: "success",
    message: validated.data.decision === "accepted" ? "Заявка принята." : "Заявка отклонена.",
  };
}
