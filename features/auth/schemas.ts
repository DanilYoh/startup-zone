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

export const betaInvitationCodeSchema = z
  .string()
  .trim()
  .length(32, "Введите 32-символьный код приглашения")
  .regex(
    /^[A-Za-z0-9_-]{32}$/,
    "Код приглашения может содержать только латинские буквы, цифры, дефис и подчёркивание",
  );

export const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Введите не менее 2 символов").max(80),
    email: authEmailSchema,
    beta_invitation_code: betaInvitationCodeSchema,
    role: z.enum(marketplaceRoles, { error: "Выберите роль на площадке" }),
    password: passwordSchema,
    repeat_password: z.string(),
    legal_document_version: z
      .string()
      .trim()
      .min(3, "Обновите страницу и повторите регистрацию")
      .max(80),
    personal_data_consent: z.literal("accepted", {
      error: "Подтвердите согласие на обработку персональных данных",
    }),
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
    beta_invitation_code: formData.get("beta_invitation_code"),
    role: formData.get("role"),
    password: formData.get("password"),
    repeat_password: formData.get("repeat_password"),
    legal_document_version: formData.get("legal_document_version"),
    personal_data_consent: formData.get("personal_data_consent"),
  });
}

export function parseSignInForm(formData: FormData) {
  return signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}
