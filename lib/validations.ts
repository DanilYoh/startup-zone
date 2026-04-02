import { z } from 'zod'

export const startupSchema = z.object({
  title: z.string().min(3, "Название должно быть минимум 3 символа"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  one_pager: z.string().min(10),
  description: z.string().min(50),
  stage: z.enum(['idea', 'mvp', 'pre_seed', 'seed', 'series_a', 'later']),
  niche: z.array(z.string()).min(1),
  funding_ask: z.number().positive().optional(),
  equity_offered: z.number().min(0).max(100).optional(),
  deck_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
})