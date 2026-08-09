export const authErrorMessages = {
  invalid_confirmation_link:
    "Ссылка подтверждения недействительна или неполна. Запросите новую ссылку.",
  confirmation_failed:
    "Ссылка подтверждения недействительна или устарела. Запросите новую ссылку.",
  password_reset_request_failed:
    "Не удалось отправить инструкцию по восстановлению. Повторите попытку позже.",
  password_update_failed:
    "Не удалось обновить пароль. Запросите новую ссылку для восстановления.",
} as const;

export type AuthErrorCode = keyof typeof authErrorMessages;

const fallbackAuthErrorMessage =
  "Не удалось завершить аутентификацию. Повторите попытку.";

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
