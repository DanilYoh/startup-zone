import { type AuthErrorCode } from "@/features/auth/errors";
import { createClient } from "@/lib/supabase/server";
import { getSafeAuthRedirectPath } from "@/lib/routing";
import { logRequestError } from "@/lib/logger";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

const emailOtpTypes = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const satisfies readonly EmailOtpType[];

const authResponseHeaders = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
} as const;

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return emailOtpTypes.some((type) => type === value);
}

function redirectWithoutAuthSecrets(request: NextRequest, pathname: string) {
  const destination = request.nextUrl.clone();
  destination.pathname = pathname;
  destination.search = "";
  return NextResponse.redirect(destination, { headers: authResponseHeaders });
}

function redirectToAuthError(request: NextRequest, code: AuthErrorCode) {
  const destination = request.nextUrl.clone();
  destination.pathname = "/auth/error";
  destination.search = "";
  destination.searchParams.set("code", code);
  return NextResponse.redirect(destination, { headers: authResponseHeaders });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = getSafeAuthRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) return redirectWithoutAuthSecrets(request, next);

    await logRequestError("auth.confirm_failed", {
      code: error.code,
      status: error.status,
      flow: "pkce",
    });
    return redirectToAuthError(request, "confirmation_failed");
  }

  if (token_hash && isEmailOtpType(type)) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) return redirectWithoutAuthSecrets(request, next);

    await logRequestError("auth.confirm_failed", {
      code: error.code,
      status: error.status,
      flow: "otp",
    });
    return redirectToAuthError(request, "confirmation_failed");
  }

  return redirectToAuthError(request, "invalid_confirmation_link");
}
