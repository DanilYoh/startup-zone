import { getAuthErrorMessage } from "../features/auth/errors";
import { describe, expect, it } from "vitest";

describe("getAuthErrorMessage", () => {
  it("maps stable auth codes to safe user-facing messages", () => {
    expect(getAuthErrorMessage("confirmation_failed")).toBe(
      "Ссылка подтверждения недействительна или устарела. Запросите новую ссылку.",
    );
  });

  it("does not echo unknown query values", () => {
    const rawMessage = "User token secret failed in upstream Auth service";
    const message = getAuthErrorMessage(rawMessage);

    expect(message).toBe("Не удалось завершить аутентификацию. Повторите попытку.");
    expect(message).not.toContain(rawMessage);
  });
});
