"use server";

import {
  parseSignInForm,
  parseSignUpForm,
  type SignInInput,
  type SignUpInput,
} from "@/features/auth/schemas";
import { logRequestError } from "@/lib/logger";
import { getSiteOrigin } from "@/lib/env";
import { getPublicLegalConfig } from "@/features/legal/server/config";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { createHash } from "node:crypto";
import { redirect } from "next/navigation";

export type SignUpActionState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<keyof SignUpInput, string[]>>;
};

export type SignInActionState = {
  status: "idle" | "error";
  message?: string;
  errors?: Partial<Record<keyof SignInInput, string[]>>;
};

function hashBetaInvitationCode(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function signUp(
  _previousState: SignUpActionState,
  formData: FormData,
): Promise<SignUpActionState> {
  if (!hasEnvVars) {
    return {
      status: "error",
      message: "Регистрация недоступна: публичная демоверсия не подключена к базе данных.",
    };
  }

  const legalConfig = getPublicLegalConfig();
  if (!legalConfig.registrationEnabled) {
    return {
      status: "error",
      message: "Регистрация временно закрыта: документы об обработке персональных данных ещё не утверждены.",
    };
  }

  const validated = parseSignUpForm(formData);

  if (!validated.success) {
    return {
      status: "error",
      message: "Проверьте выделенные поля и повторите попытку.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  if (validated.data.legal_document_version !== legalConfig.documentVersion) {
    return {
      status: "error",
      message: "Версия документов изменилась. Обновите страницу и подтвердите согласие снова.",
    };
  }

  const invitationHash = hashBetaInvitationCode(validated.data.beta_invitation_code);
  const supabase = await createClient();
  const { data: invitationValid, error: invitationError } = await supabase.rpc(
    "is_beta_invitation_valid",
    {
      candidate_email: validated.data.email,
      candidate_hash: invitationHash,
      candidate_role: validated.data.role,
    },
  );

  if (invitationError) {
    await logRequestError("auth.invitation_validation_failed", {
      code: invitationError.code,
    });
    return {
      status: "error",
      message: "Регистрация временно недоступна. Попробуйте позже.",
    };
  }

  if (!invitationValid) {
    return {
      status: "error",
      message: "Код приглашения недействителен, уже использован или не соответствует email и роли.",
    };
  }

  const origin = getSiteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        beta_invitation_hash: invitationHash,
        full_name: validated.data.full_name,
        legal_consent: true,
        legal_document_version: legalConfig.documentVersion,
        role: validated.data.role,
      },
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/dashboard/profile")}`,
    },
  });

  if (error) {
    await logRequestError("auth.signup_failed", {
      code: error.code,
      status: error.status,
    });

    return {
      status: "error",
      message:
        error.status === 429
          ? "Слишком много попыток регистрации. Подождите и попробуйте снова."
          : "Не удалось создать аккаунт. Проверьте email, роль и код приглашения или попробуйте позже.",
    };
  }

  if (data.session) redirect("/dashboard/profile");
  redirect("/auth/sign-up-success");
}

export async function signIn(
  _previousState: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  if (!hasEnvVars) {
    return { status: "error", message: "Вход недоступен: публичная демоверсия не подключена к базе данных." };
  }

  const validated = parseSignInForm(formData);
  if (!validated.success) {
    return {
      status: "error",
      message: "Проверьте выделенные поля и повторите попытку.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    await logRequestError("auth.signin_failed", { code: error.code, status: error.status });
    return {
      status: "error",
      message:
        error.status === 429
          ? "Слишком много попыток входа. Подождите и попробуйте снова."
          : "Неверная электронная почта или пароль.",
    };
  }

  redirect("/dashboard");
}
