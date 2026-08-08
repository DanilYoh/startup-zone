export const authErrorMessages = {
  invalid_confirmation_link:
    "This confirmation link is invalid or incomplete. Request a new link and try again.",
  confirmation_failed:
    "This confirmation link is invalid or has expired. Request a new link and try again.",
  password_reset_request_failed:
    "Could not send reset instructions. Please try again later.",
  password_update_failed:
    "Could not update your password. Request a new reset link and try again.",
} as const;

export type AuthErrorCode = keyof typeof authErrorMessages;

const fallbackAuthErrorMessage =
  "Authentication could not be completed. Please try again.";

export function getAuthErrorMessage(code: unknown) {
  const value = Array.isArray(code) ? code[0] : code;

  if (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(authErrorMessages, value)
  ) {
    return authErrorMessages[value as AuthErrorCode];
  }

  return fallbackAuthErrorMessage;
}
