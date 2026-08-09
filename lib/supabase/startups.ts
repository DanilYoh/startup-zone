import "server-only";

import type { StartupDirectoryFilters } from "@/lib/startup-directory";
import { toIlikePattern } from "@/lib/startup-directory";
import { DEFAULT_PAGE_SIZE, pageCount, pageRange } from "@/lib/pagination";
import { hasEnvVars } from "@/lib/utils";
import { logRequestError } from "@/lib/logger";
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
    await logRequestError("startup.directory_read_failed", {
      code: error instanceof StartupReadError ? error.code : "unexpected",
    });
    return { status: "error" };
  }
}

export async function getActiveStartupBySlug(slug: string) {
  if (!hasEnvVars) return { status: "unconfigured" } as const;

  try {
    const supabase = await createClient();
    const { data: startup, error } = await supabase
      .from("startups")
      .select(
        "id, founder_id, title, slug, one_pager, description, stage, niche, funding_ask, equity_offered, website_url, deck_url, created_at",
      )
      .eq("is_active", true)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new StartupReadError(error.code);
    if (!startup) return { status: "ready", data: null } as const;

    const { data: founder, error: founderError } = await supabase
      .from("public_founder_profiles")
      .select("full_name, headline, founder_experience, location")
      .eq("id", startup.founder_id)
      .maybeSingle();

    if (founderError) throw new StartupReadError(founderError.code);
    return { status: "ready", data: { ...startup, founder } } as const;
  } catch (error) {
    await logRequestError("startup.public_read_failed", {
      code: error instanceof StartupReadError ? error.code : "unexpected",
    });
    return { status: "error" } as const;
  }
}

async function queryActiveStartups(filters: StartupDirectoryFilters) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page, DEFAULT_PAGE_SIZE);
  let query = supabase
    .from("startups")
    .select(
      "id, founder_id, title, slug, one_pager, stage, niche, funding_ask, equity_offered, created_at",
      { count: "exact" },
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (filters.query) query = query.ilike("title", toIlikePattern(filters.query));
  if (filters.stage) query = query.eq("stage", filters.stage);
  if (filters.niche) query = query.contains("niche", [filters.niche]);

  const { data, count, error } = await query;
  if (error) {
    if (error.code !== "PGRST103") throw new StartupReadError(error.code);

    const total = await countActiveStartups(supabase, filters);
    return {
      items: [],
      page: filters.page,
      pageCount: pageCount(total, DEFAULT_PAGE_SIZE),
      total,
    };
  }

  const total = count ?? 0;
  const founderIds = [...new Set(data.map((startup) => startup.founder_id))];
  const founderResult = founderIds.length
    ? await supabase
        .from("public_founder_profiles")
        .select("id, full_name, location")
        .in("id", founderIds)
    : { data: [], error: null };

  if (founderResult.error) throw new StartupReadError(founderResult.error.code);

  const founders = new Map(founderResult.data.map((founder) => [founder.id, founder]));
  return {
    items: data.map(({ founder_id: founderId, ...startup }) => ({
      ...startup,
      founder: founders.get(founderId) ?? null,
    })),
    page: filters.page,
    pageCount: pageCount(total, DEFAULT_PAGE_SIZE),
    total,
  };
}

async function countActiveStartups(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: StartupDirectoryFilters,
) {
  let query = supabase
    .from("startups")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (filters.query) query = query.ilike("title", toIlikePattern(filters.query));
  if (filters.stage) query = query.eq("stage", filters.stage);
  if (filters.niche) query = query.contains("niche", [filters.niche]);

  const { count, error } = await query;
  if (error) throw new StartupReadError(error.code);
  return count ?? 0;
}

class StartupReadError extends Error {
  constructor(readonly code: string) {
    super("Startup read failed");
  }
}
