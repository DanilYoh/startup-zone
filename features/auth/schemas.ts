import { z } from "zod";

export const marketplaceRoles = ["founder", "investor"] as const;

export const marketplaceRoleLabels: Record<(typeof marketplaceRoles)[number], string> = {
  founder: "Основатель",
  investor: "Инвестор",
};

export const marketplaceRoleDescriptions: Record<(typeof marketplaceRoles)[number], string> = {
  founder: "Публикуйте стартап и рассматривайте интерес инвесторов.",
  investor: "Создайте инвестиционный профиль, находите стартапы и отправляйте заявки.",
};

export const authEmailSchema = z
  .string()
  .trim()
  .email("Введите корректный адрес электронной почты")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "Используйте не менее 8 символов")
  .max(72, "Используйте не более 72 символов");

export const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Введите не менее 2 символов").max(80),
    email: authEmailSchema,
    role: z.enum(marketplaceRoles, { error: "Выберите роль на площадке" }),
    password: passwordSchema,
    repeat_password: z.string(),
  })
  .refine((value) => value.password === value.repeat_password, {
    message: "Пароли не совпадают",
    path: ["repeat_password"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(1, "Введите пароль").max(72),
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
