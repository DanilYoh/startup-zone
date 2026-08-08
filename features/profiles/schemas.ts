import { z } from "zod";

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

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Use at least 2 characters").max(80),
  bio: optionalText(1_000, "Keep the description under 1,000 characters"),
  location: optionalText(120, "Keep the location under 120 characters"),
  avatar_url: optionalHttpUrl,
  linkedin_url: optionalLinkedInUrl,
});

export type ProfileInput = z.infer<typeof profileSchema>;

export function parseProfileForm(formData: FormData) {
  return profileSchema.safeParse({
    full_name: formData.get("full_name"),
    bio: formData.get("bio"),
    location: formData.get("location"),
    avatar_url: formData.get("avatar_url"),
    linkedin_url: formData.get("linkedin_url"),
  });
}

