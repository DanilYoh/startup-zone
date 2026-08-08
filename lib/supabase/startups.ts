import "server-only";

import type { StartupDirectoryFilters } from "@/lib/startup-directory";
import { toIlikePattern } from "@/lib/startup-directory";
import { hasEnvVars } from "@/lib/utils";
import { logServerError } from "@/lib/logger";
import { createClient } from "./server";

export type PublicStartupRead<T> =
  | { status: "ready"; data: T }
  | { status: "unconfigured" }
  | { status: "error" };

export async function listActiveStartups(
  filters: StartupDirectoryFilters,
): Promise<PublicStartupRead<Awaited<ReturnType<typeof queryActiveStartups>>>> {
  if (!hasEnvVars) return { status: "unconfigured" };

  try {
    const data = await queryActiveStartups(filters);
    return { status: "ready", data };
  } catch (error) {
    logServerError("startup.directory_read_failed", {
      code: error instanceof StartupReadError ? error.code : "unexpected",
    });
    return { status: "error" };
  }
}

export async function getActiveStartupBySlug(slug: string) {
  if (!hasEnvVars) return { status: "unconfigured" } as const;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("startups")
      .select(
        "id, founder_id, title, slug, one_pager, description, stage, niche, funding_ask, equity_offered, website_url, deck_url, created_at, founder:profiles!startups_founder_id_fkey(full_name, location)",
      )
      .eq("is_active", true)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new StartupReadError(error.code);
    return { status: "ready", data } as const;
  } catch (error) {
    logServerError("startup.public_read_failed", {
      code: error instanceof StartupReadError ? error.code : "unexpected",
    });
    return { status: "error" } as const;
  }
}

async function queryActiveStartups(filters: StartupDirectoryFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("startups")
    .select(
      "id, title, slug, one_pager, stage, niche, funding_ask, equity_offered, created_at, founder:profiles!startups_founder_id_fkey(full_name, location)",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(48);

  if (filters.query) query = query.ilike("title", toIlikePattern(filters.query));
  if (filters.stage) query = query.eq("stage", filters.stage);
  if (filters.niche) query = query.contains("niche", [filters.niche]);

  const { data, error } = await query;
  if (error) throw new StartupReadError(error.code);
  return data;
}

class StartupReadError extends Error {
  constructor(readonly code: string) {
    super("Startup read failed");
  }
}
