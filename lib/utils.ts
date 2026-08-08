import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const hasEnvVars = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
