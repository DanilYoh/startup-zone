"use server";

import {
  parseSignInForm,
  parseSignUpForm,
  type SignInInput,
  type SignUpInput,
} from "@/features/auth/schemas";
import { logRequestError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { headers } from "next/headers";
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

function normalizeOrigin(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
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

  const validated = parseSignUpForm(formData);

  if (!validated.success) {
    return {
      status: "error",
      message: "Проверьте выделенные поля и повторите попытку.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const requestOrigin = normalizeOrigin((await headers()).get("origin"));
  const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? null);
  const origin = configuredOrigin ?? requestOrigin ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      data: {
        full_name: validated.data.full_name,
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
          : "Не удалось создать аккаунт. Проверьте данные или попробуйте позже.",
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
