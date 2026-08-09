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
  idea: "Идея",
  mvp: "MVP",
  pre_seed: "Pre-seed",
  seed: "Seed",
  series_a: "Series A",
  later: "Поздняя стадия",
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const optionalUrl = z
  .union([z.literal(""), z.string().trim().url("Введите корректный URL")])
  .refine((value) => value === "" || isHttpUrl(value), "Используйте HTTP(S)-ссылку")
  .transform((value) => value || undefined);

export const startupSchema = z.object({
  title: z.string().trim().min(3, "Введите не менее 3 символов").max(80),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Используйте строчные латинские буквы, цифры и дефисы"),
  one_pager: z
    .string()
    .trim()
    .min(10, "Введите не менее 10 символов")
    .max(240, "Краткое описание должно быть не длиннее 240 символов"),
  description: z
    .string()
    .trim()
    .min(50, "Введите не менее 50 символов")
    .max(5_000, "Описание должно быть не длиннее 5 000 символов"),
  stage: z.enum(startupStages),
  niche: z
    .array(z.string().trim().min(1).max(40))
    .min(1)
    .max(8)
    .refine(
      (values) => new Set(values.map((value) => value.toLocaleLowerCase("ru-RU"))).size === values.length,
      "Не повторяйте одну и ту же нишу",
    ),
  funding_ask: z.number().positive().max(1_000_000_000).optional(),
  equity_offered: z.number().min(0).max(100).optional(),
  deck_url: optionalUrl.optional(),
  website_url: optionalUrl.optional(),
});

export type StartupInput = z.infer<typeof startupSchema>;
