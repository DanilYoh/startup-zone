import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 12;
export const APPLICATION_PAGE_SIZE = 20;

const pageSchema = z.coerce.number().int().min(1).max(10_000);

export function parsePage(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  const parsed = pageSchema.safeParse(first);
  return parsed.success ? parsed.data : 1;
}

export function pageRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function pageCount(total: number, pageSize: number) {
  return Math.ceil(total / pageSize);
}
