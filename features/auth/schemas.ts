import { z } from "zod";

export const marketplaceRoles = ["founder", "specialist", "investor"] as const;

export const marketplaceRoleLabels: Record<(typeof marketplaceRoles)[number], string> = {
  founder: "Founder",
  specialist: "Specialist",
  investor: "Investor",
};

export const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Use at least 2 characters").max(80),
    email: z.string().trim().email("Enter a valid email address").max(254),
    role: z.enum(marketplaceRoles, { error: "Choose a marketplace role" }),
    password: z.string().min(8, "Use at least 8 characters").max(72),
    repeat_password: z.string(),
  })
  .refine((value) => value.password === value.repeat_password, {
    message: "Passwords do not match",
    path: ["repeat_password"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export function parseSignUpForm(formData: FormData) {
  return signUpSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
    repeat_password: formData.get("repeat_password"),
  });
}

