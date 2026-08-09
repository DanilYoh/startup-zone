import { z } from "zod";

export const marketplaceRoles = ["founder", "investor"] as const;

export const marketplaceRoleLabels: Record<(typeof marketplaceRoles)[number], string> = {
  founder: "Founder",
  investor: "Investor",
};

export const marketplaceRoleDescriptions: Record<(typeof marketplaceRoles)[number], string> = {
  founder: "Publish a startup, manage its story, and review investor interest.",
  investor: "Build an investment profile, discover startups, and request a conversation.",
};

export const authEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters");

export const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Use at least 2 characters").max(80),
    email: authEmailSchema,
    role: z.enum(marketplaceRoles, { error: "Choose a marketplace role" }),
    password: passwordSchema,
    repeat_password: z.string(),
  })
  .refine((value) => value.password === value.repeat_password, {
    message: "Passwords do not match",
    path: ["repeat_password"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(1, "Enter your password").max(72),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const passwordResetRequestSchema = z.object({
  email: authEmailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

export function parseSignUpForm(formData: FormData) {
  return signUpSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
    repeat_password: formData.get("repeat_password"),
  });
}

export function parseSignInForm(formData: FormData) {
  return signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}
