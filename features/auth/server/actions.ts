"use server";

import {
  parseSignInForm,
  parseSignUpForm,
  type SignInInput,
  type SignUpInput,
} from "@/features/auth/schemas";
import { logServerError } from "@/lib/logger";
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
      message: "Account creation is unavailable in the unconfigured public demo.",
    };
  }

  const validated = parseSignUpForm(formData);

  if (!validated.success) {
    return {
      status: "error",
      message: "Review the highlighted fields and try again.",
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
      emailRedirectTo: `${origin}/dashboard/profile`,
    },
  });

  if (error) {
    logServerError("auth.signup_failed", {
      code: error.code,
      status: error.status,
    });

    return {
      status: "error",
      message:
        error.status === 429
          ? "Too many sign-up attempts. Wait a moment and try again."
          : "Could not create the account. Check the details or try again later.",
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
    return { status: "error", message: "Sign in is unavailable in the unconfigured public demo." };
  }

  const validated = parseSignInForm(formData);
  if (!validated.success) {
    return {
      status: "error",
      message: "Review the highlighted fields and try again.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    logServerError("auth.signin_failed", { code: error.code, status: error.status });
    return {
      status: "error",
      message:
        error.status === 429
          ? "Too many sign-in attempts. Wait a moment and try again."
          : "Email or password is incorrect.",
    };
  }

  redirect("/protected");
}
