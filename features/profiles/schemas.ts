import { z } from "zod";
import { startupStages } from "@/lib/validations";
import { parseMarketNumber } from "@/lib/market";

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isLinkedInUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
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

const optionalHttpUrl = z
  .string()
  .trim()
  .max(2_048, "Keep the URL under 2,048 characters")
  .refine((value) => value === "" || isHttpUrl(value), "Use an HTTP(S) URL")
  .transform((value) => value || null);

const optionalLinkedInUrl = z
  .string()
  .trim()
  .max(2_048, "Keep the URL under 2,048 characters")
  .refine(
    (value) => value === "" || isLinkedInUrl(value),
    "Use an HTTPS linkedin.com URL",
  )
  .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .max(254, "Keep the email under 254 characters")
  .refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Enter a valid email address",
  )
  .transform((value) => value.toLowerCase() || null);

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Use at least 2 characters").max(80),
  headline: optionalText(120, "Keep the headline under 120 characters"),
  bio: optionalText(1_000, "Keep the description under 1,000 characters"),
  location: optionalText(120, "Keep the location under 120 characters"),
  avatar_url: optionalHttpUrl,
  linkedin_url: optionalLinkedInUrl,
  founder_experience: optionalText(1_200, "Keep founder experience under 1,200 characters"),
  investor_organization: optionalText(120, "Keep the organization under 120 characters"),
  investment_thesis: optionalText(1_500, "Keep the investment thesis under 1,500 characters"),
  preferred_stages: z
    .array(z.enum(startupStages))
    .max(6, "Choose no more than six stages")
    .refine((stages) => new Set(stages).size === stages.length, "Choose each stage only once"),
  ticket_min: z.preprocess(
    normalizeCurrencyInput,
    z.number().int().positive().max(1_000_000_000).nullable(),
  ),
  ticket_max: z.preprocess(
    normalizeCurrencyInput,
    z.number().int().positive().max(1_000_000_000).nullable(),
  ),
  website_url: optionalHttpUrl,
}).superRefine((profile, context) => {
  if (
    profile.ticket_min !== null &&
    profile.ticket_max !== null &&
    profile.ticket_min > profile.ticket_max
  ) {
    context.addIssue({
      code: "custom",
      message: "Maximum ticket must be greater than or equal to the minimum",
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
    contact_url: optionalHttpUrl,
    sharing_enabled: z.boolean(),
  })
  .superRefine((contact, context) => {
    if (contact.sharing_enabled && !contact.contact_email && !contact.contact_url) {
      context.addIssue({
        code: "custom",
        message: "Add an email or contact link before enabling contact exchange",
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
