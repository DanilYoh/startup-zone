import { z } from "zod";

export const startupStages = [
  "idea",
  "mvp",
  "pre_seed",
  "seed",
  "series_a",
  "later",
] as const;

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().url("Enter a valid URL"),
]);

export const startupSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters").max(80),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  one_pager: z.string().trim().min(10).max(240),
  description: z.string().trim().min(50).max(5_000),
  stage: z.enum(startupStages),
  niche: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
  funding_ask: z.number().positive().max(1_000_000_000).optional(),
  equity_offered: z.number().min(0).max(100).optional(),
  deck_url: optionalUrl.optional(),
  website_url: optionalUrl.optional(),
});

export type StartupInput = z.infer<typeof startupSchema>;
