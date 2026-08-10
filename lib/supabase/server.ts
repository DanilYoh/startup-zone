import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";
import { cookies, headers } from "next/headers";
import type { Database } from "./types";

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const environment = getSupabaseEnv();
  const requestId = requestHeaders.get("x-request-id");

  return createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      global: requestId ? { headers: { "x-request-id": requestId } } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot persist refreshed cookies. The proxy handles it.
          }
        },
      },
    },
  );
}
