import { type AuthErrorCode } from "@/features/auth/errors";
import { createClient } from "@/lib/supabase/server";
import { getSafeAuthRedirectPath } from "@/lib/routing";
import { logRequestError } from "@/lib/logger";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = getSafeAuthRedirectPath(searchParams.get("next"));

  const redirectToError = (code: AuthErrorCode) =>
    `/auth/error?code=${code}`;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirect(next);
    } else {
      await logRequestError("auth.confirm_failed", {
        code: error.code,
        status: error.status,
      });
      redirect(redirectToError("confirmation_failed"));
    }
  }

  redirect(redirectToError("invalid_confirmation_link"));
}
