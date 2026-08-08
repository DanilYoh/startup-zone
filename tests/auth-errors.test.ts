import { getAuthErrorMessage } from "../features/auth/errors";
import { describe, expect, it } from "vitest";

describe("getAuthErrorMessage", () => {
  it("maps stable auth codes to safe user-facing messages", () => {
    expect(getAuthErrorMessage("confirmation_failed")).toBe(
      "This confirmation link is invalid or has expired. Request a new link and try again.",
    );
  });

  it("does not echo unknown query values", () => {
    const rawMessage = "User token secret failed in upstream Auth service";
    const message = getAuthErrorMessage(rawMessage);

    expect(message).toBe("Authentication could not be completed. Please try again.");
    expect(message).not.toContain(rawMessage);
  });
});
