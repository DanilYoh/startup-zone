import { z } from "zod";

export const applicationSchema = z.object({
  startup_id: z.coerce.number().int().positive(),
  message: z
    .string()
    .trim()
    .min(20, "Use at least 20 characters")
    .max(2_000, "Keep the message under 2,000 characters"),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const moderationSchema = z.object({
  application_id: z.coerce.number().int().positive(),
  decision: z.enum(["accepted", "rejected"]),
});

function singleValue(formData: FormData, name: string) {
  const values = formData.getAll(name);
  return values.length === 1 ? values[0] : null;
}

export function parseModerationForm(formData: FormData) {
  return moderationSchema.safeParse({
    application_id: singleValue(formData, "application_id"),
    decision: singleValue(formData, "decision"),
  });
}

export function parseApplicationForm(formData: FormData) {
  return applicationSchema.safeParse({
    startup_id: singleValue(formData, "startup_id"),
    message: singleValue(formData, "message"),
  });
}
