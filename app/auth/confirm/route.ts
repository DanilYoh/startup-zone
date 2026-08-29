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

type ConfirmationCredential =
  | { flow: "pkce"; code: string }
  | { flow: "otp"; tokenHash: string; type: EmailOtpType };

function parseConfirmationCredential(searchParams: URLSearchParams): ConfirmationCredential | null {
  const codes = searchParams.getAll("code");
  const tokenHashes = searchParams.getAll("token_hash");
  const types = searchParams.getAll("type");

  if (codes.length === 1 && codes[0] && tokenHashes.length === 0 && types.length === 0) {
    return { flow: "pkce", code: codes[0] };
  }

  if (
    codes.length === 0 &&
    tokenHashes.length === 1 &&
    tokenHashes[0] &&
    types.length === 1 &&
    isEmailOtpType(types[0])
  ) {
    return { flow: "otp", tokenHash: tokenHashes[0], type: types[0] };
  }

  return null;
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
  const credential = parseConfirmationCredential(searchParams);
  const next = getSafeAuthRedirectPath(searchParams.get("next"));

  if (!credential) {
    return redirectToAuthError(request, "invalid_confirmation_link");
  }

  if (credential.flow === "pkce") {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(credential.code);

    if (!error) return redirectWithoutAuthSecrets(request, next);

    await logRequestError("auth.confirm_failed", {
      code: error.code,
      status: error.status,
      flow: "pkce",
    });
    return redirectToAuthError(request, "confirmation_failed");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    type: credential.type,
    token_hash: credential.tokenHash,
  });
  if (!error) return redirectWithoutAuthSecrets(request, next);

  await logRequestError("auth.confirm_failed", {
    code: error.code,
    status: error.status,
    flow: "otp",
  });
  return redirectToAuthError(request, "confirmation_failed");
}
