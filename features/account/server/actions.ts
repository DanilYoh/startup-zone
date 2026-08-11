"use server";

import { logRequestError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const deletionSchema = z.object({
  current_password: z.string().min(1).max(1_024),
  confirmation: z.literal("УДАЛИТЬ"),
});

export type AccountDeletionActionState = {
  status: "idle" | "error";
  message?: string;
};

export async function deleteAccount(
  _previousState: AccountDeletionActionState,
  formData: FormData,
): Promise<AccountDeletionActionState> {
  const validated = deletionSchema.safeParse({
    current_password: formData.get("current_password"),
    confirmation: formData.get("confirmation"),
  });
  if (!validated.success) {
    return {
      status: "error",
      message: "Введите текущий пароль и слово УДАЛИТЬ без изменений.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  if (!user.email) {
    return { status: "error", message: "У аккаунта нет адреса для повторной проверки." };
  }

  const { error: authenticationError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: validated.data.current_password,
  });
  if (authenticationError) {
    return { status: "error", message: "Текущий пароль не подтверждён." };
  }

  const { data: deleted, error } = await supabase.rpc("delete_my_account");
  if (error || !deleted) {
    await logRequestError("account.deletion_failed", { code: error?.code });
    return { status: "error", message: "Не удалось удалить аккаунт. Повторите позже." };
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/?account=deleted");
}
