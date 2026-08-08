import { z } from "zod";

export const startupStages = [
  "idea",
  "mvp",
  "pre_seed",
  "seed",
  "series_a",
  "later",
] as const;

export const startupStageLabels: Record<(typeof startupStages)[number], string> = {
  idea: "Idea",
  mvp: "MVP",
  pre_seed: "Pre-seed",
  seed: "Seed",
  series_a: "Series A",
  later: "Later stage",
};

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("Enter a valid URL")])
  .transform((value) => value || undefined);

export const startupSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters").max(80),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  one_pager: z
    .string()
    .trim()
    .min(10, "Use at least 10 characters")
    .max(240, "Keep the summary under 240 characters"),
  description: z
    .string()
    .trim()
    .min(50, "Use at least 50 characters")
    .max(5_000, "Keep the description under 5,000 characters"),
  stage: z.enum(startupStages),
  niche: z.array(z.string().trim().min(1).max(40)).min(1).max(8),
  funding_ask: z.number().positive().max(1_000_000_000).optional(),
  equity_offered: z.number().min(0).max(100).optional(),
  deck_url: optionalUrl.optional(),
  website_url: optionalUrl.optional(),
});

export type StartupInput = z.infer<typeof startupSchema>;
