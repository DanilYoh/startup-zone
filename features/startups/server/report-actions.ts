"use server";

import { logRequestError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const reportSchema = z.object({
  startup_id: z.coerce.number().int().positive(),
  link_kind: z.enum(["website", "deck"]),
  reason: z.enum(["phishing", "malware", "misleading", "privacy", "other"]),
});

export type LinkReportActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function reportStartupLink(
  _previousState: LinkReportActionState,
  formData: FormData,
): Promise<LinkReportActionState> {
  const validated = reportSchema.safeParse({
    startup_id: formData.get("startup_id"),
    link_kind: formData.get("link_kind"),
    reason: formData.get("reason"),
  });
  if (!validated.success) {
    return { status: "error", message: "Выберите причину жалобы и повторите попытку." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error", message: "Войдите в аккаунт, чтобы отправить жалобу." };
  }

  const { data: created, error } = await supabase.rpc("report_startup_link", {
    reported_link_kind: validated.data.link_kind,
    reported_reason: validated.data.reason,
    reported_startup_id: validated.data.startup_id,
  });
  if (error) {
    await logRequestError("startup.link_report_failed", { code: error.code });
    return { status: "error", message: "Не удалось отправить жалобу. Повторите позже." };
  }

  return created
    ? { status: "success", message: "Жалоба отправлена на проверку." }
    : { status: "success", message: "Эта ссылка уже ожидает проверки." };
}
