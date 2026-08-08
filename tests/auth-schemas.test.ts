import { describe, expect, it } from "vitest";
import {
  parseSignInForm,
  parseSignUpForm,
  signInSchema,
  signUpSchema,
} from "../features/auth/schemas";

describe("signUpSchema", () => {
  it.each(["founder", "specialist", "investor"] as const)(
    "accepts the %s marketplace role",
    (role) => {
      expect(
        signUpSchema.safeParse({
          full_name: "Taylor Jordan",
          email: "taylor@example.test",
          role,
          password: "safe-password",
          repeat_password: "safe-password",
        }).success,
      ).toBe(true);
    },
  );

  it("rejects unknown roles", () => {
    const result = signUpSchema.safeParse({
      full_name: "Taylor Jordan",
      email: "taylor@example.test",
      role: "admin",
      password: "safe-password",
      repeat_password: "safe-password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.role).toBeDefined();
    }
  });

  it("rejects mismatched passwords", () => {
    const result = signUpSchema.safeParse({
      full_name: "Taylor Jordan",
      email: "taylor@example.test",
      role: "founder",
      password: "safe-password",
      repeat_password: "different-password",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.repeat_password).toBeDefined();
    }
  });

  it("treats FormData values as untrusted input", () => {
    const formData = new FormData();
    formData.set("full_name", "T");
    formData.set("email", "not-an-email");
    formData.set("role", "founder");
    formData.set("password", "short");
    formData.set("repeat_password", "short");

    expect(parseSignUpForm(formData).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("normalizes a valid email and accepts a password", () => {
    expect(
      signInSchema.parse({ email: "  user@example.test ", password: "safe-password" }),
    ).toEqual({ email: "user@example.test", password: "safe-password" });
  });

  it("rejects invalid FormData values at the server boundary", () => {
    const formData = new FormData();
    formData.set("email", "not-an-email");
    formData.set("password", "");

    expect(parseSignInForm(formData).success).toBe(false);
  });
});
