import { z } from "zod";
import { parsePage } from "./pagination";
import { startupStages } from "./validations";

export type StartupDirectorySearchParams = Record<
  string,
  string | string[] | undefined
>;

export type StartupDirectoryFilters = {
  query?: string;
  stage?: (typeof startupStages)[number];
  niche?: string;
  page: number;
};

const querySchema = z.string().trim().min(1).max(80);
const nicheSchema = z.string().trim().min(1).max(40);
const stageSchema = z.enum(startupStages);

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseOptional<T>(schema: z.ZodType<T>, value: string | string[] | undefined) {
  const result = schema.safeParse(firstValue(value));
  return result.success ? result.data : undefined;
}

export function parseStartupDirectoryFilters(
  searchParams: StartupDirectorySearchParams,
): StartupDirectoryFilters {
  return {
    query: parseOptional(querySchema, searchParams.q),
    stage: parseOptional(stageSchema, searchParams.stage),
    niche: parseOptional(nicheSchema, searchParams.niche),
    page: parsePage(searchParams.page),
  };
}

export function hasStartupDirectoryFilters(filters: StartupDirectoryFilters) {
  return Boolean(filters.query || filters.stage || filters.niche);
}

export function toIlikePattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

export function startupDirectoryHref(filters: StartupDirectoryFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.niche) params.set("niche", filters.niche);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/startups?${query}` : "/startups";
}
