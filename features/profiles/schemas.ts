import { z } from "zod";
import { startupStages } from "@/lib/validations";
import { parseMarketNumber } from "@/lib/market";
import { isPublicHttpsUrl } from "@/lib/external-url";

function isLinkedInUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      isPublicHttpsUrl(value) &&
      (url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com"))
    );
  } catch {
    return false;
  }
}

const optionalText = (maximum: number, message: string) =>
  z
    .string()
    .trim()
    .max(maximum, message)
    .transform((value) => value || null);

const optionalPublicHttpsUrl = z
  .string()
  .trim()
  .max(2_048, "Введите не более 2 048 символов")
  .refine(
    (value) => value === "" || isPublicHttpsUrl(value),
    "Укажите публичную HTTPS-ссылку без локального или служебного адреса",
  )
  .transform((value) => value || null);

const optionalLinkedInUrl = z
  .string()
  .trim()
  .max(2_048, "Введите не более 2 048 символов")
  .refine(
    (value) => value === "" || isLinkedInUrl(value),
    "Укажите HTTPS-ссылку на linkedin.com",
  )
  .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .max(254, "Введите не более 254 символов")
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Введите корректный адрес электронной почты",
  )
  .transform((value) => value.toLowerCase() || null);

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Введите не менее 2 символов").max(80, "Введите не более 80 символов"),
  headline: optionalText(120, "Введите не более 120 символов"),
  bio: optionalText(1_000, "Введите не более 1 000 символов"),
  location: optionalText(120, "Введите не более 120 символов"),
  avatar_url: optionalPublicHttpsUrl,
  linkedin_url: optionalLinkedInUrl,
  founder_experience: optionalText(1_200, "Введите не более 1 200 символов"),
  investor_organization: optionalText(120, "Введите не более 120 символов"),
  investment_thesis: optionalText(1_500, "Введите не более 1 500 символов"),
  preferred_stages: z
    .array(z.enum(startupStages))
    .max(6, "Выберите не более шести стадий")
    .refine((stages) => new Set(stages).size === stages.length, "Каждую стадию можно выбрать только один раз"),
  ticket_min: z.preprocess(
    normalizeCurrencyInput,
    z.number().int().positive().max(1_000_000_000).nullable(),
  ),
  ticket_max: z.preprocess(
    normalizeCurrencyInput,
    z.number().int().positive().max(1_000_000_000).nullable(),
  ),
  website_url: optionalPublicHttpsUrl,
}).superRefine((profile, context) => {
  if (
    profile.ticket_min !== null &&
    profile.ticket_max !== null &&
    profile.ticket_min > profile.ticket_max
  ) {
    context.addIssue({
      code: "custom",
      message: "Максимальный чек должен быть не меньше минимального",
      path: ["ticket_max"],
    });
  }
});

function normalizeCurrencyInput(value: unknown) {
  if (value === "" || value === null) return null;
  return typeof value === "string" ? parseMarketNumber(value) : value;
}

export type ProfileInput = z.infer<typeof profileSchema>;

export const profileContactSchema = z
  .object({
    contact_email: optionalEmail,
    contact_url: optionalPublicHttpsUrl,
    sharing_enabled: z.boolean(),
  })
  .superRefine((contact, context) => {
    if (contact.sharing_enabled && !contact.contact_email && !contact.contact_url) {
      context.addIssue({
        code: "custom",
        message: "Добавьте электронную почту или ссылку перед включением обмена контактами",
        path: ["contact_email"],
      });
    }
  });

export type ProfileContactInput = z.infer<typeof profileContactSchema>;

function singleText(formData: FormData, name: string) {
  const values = formData.getAll(name);
  if (values.length === 0) return "";
  return values.length === 1 && typeof values[0] === "string" ? values[0] : null;
}

export function parseProfileForm(formData: FormData) {
  return profileSchema.safeParse({
    full_name: singleText(formData, "full_name"),
    headline: singleText(formData, "headline"),
    bio: singleText(formData, "bio"),
    location: singleText(formData, "location"),
    avatar_url: singleText(formData, "avatar_url"),
    linkedin_url: singleText(formData, "linkedin_url"),
    founder_experience: singleText(formData, "founder_experience"),
    investor_organization: singleText(formData, "investor_organization"),
    investment_thesis: singleText(formData, "investment_thesis"),
    preferred_stages: formData
      .getAll("preferred_stages")
      .filter((value): value is string => typeof value === "string"),
    ticket_min: singleText(formData, "ticket_min"),
    ticket_max: singleText(formData, "ticket_max"),
    website_url: singleText(formData, "website_url"),
  });
}

export function parseProfileContactForm(formData: FormData) {
  const sharingValues = formData.getAll("sharing_enabled");

  return profileContactSchema.safeParse({
    contact_email: singleText(formData, "contact_email"),
    contact_url: singleText(formData, "contact_url"),
    sharing_enabled:
      sharingValues.length === 0
        ? false
        : sharingValues.length === 1 && sharingValues[0] === "on"
          ? true
          : null,
  });
}
