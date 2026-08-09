import { describe, expect, it } from "vitest";
import {
  hasStartupDirectoryFilters,
  parseStartupDirectoryFilters,
  startupDirectoryHref,
  toIlikePattern,
} from "../lib/startup-directory";

describe("parseStartupDirectoryFilters", () => {
  it("normalizes supported directory filters", () => {
    expect(
      parseStartupDirectoryFilters({
        q: "  Climate Lens  ",
        stage: "mvp",
        niche: " ClimateTech ",
      }),
    ).toEqual({
      query: "Climate Lens",
      stage: "mvp",
      niche: "ClimateTech",
      page: 1,
    });
  });

  it("ignores unsupported and oversized values", () => {
    expect(
      parseStartupDirectoryFilters({
        q: "q".repeat(81),
        stage: "not-a-stage",
        niche: "n".repeat(41),
      }),
    ).toEqual({ query: undefined, stage: undefined, niche: undefined, page: 1 });
  });

  it("uses the first value when a query parameter is repeated", () => {
    expect(parseStartupDirectoryFilters({ stage: ["seed", "idea"] }).stage).toBe("seed");
  });

  it("accepts a bounded positive page and rejects invalid pages", () => {
    expect(parseStartupDirectoryFilters({ page: "3" }).page).toBe(3);
    expect(parseStartupDirectoryFilters({ page: "0" }).page).toBe(1);
    expect(parseStartupDirectoryFilters({ page: "10001" }).page).toBe(1);
  });
});

describe("startup directory query helpers", () => {
  it("detects active filters", () => {
    expect(hasStartupDirectoryFilters({ page: 1 })).toBe(false);
    expect(hasStartupDirectoryFilters({ niche: "SaaS", page: 1 })).toBe(true);
  });

  it("escapes SQL LIKE wildcard characters", () => {
    expect(toIlikePattern("50%_growth\\path")).toBe("%50\\%\\_growth\\\\path%");
  });

  it("preserves filters in pagination links and omits the first page", () => {
    const filters = { query: "Climate Lens", stage: "mvp" as const, page: 2 };

    expect(startupDirectoryHref(filters, 3)).toBe(
      "/startups?q=Climate+Lens&stage=mvp&page=3",
    );
    expect(startupDirectoryHref(filters, 1)).toBe("/startups?q=Climate+Lens&stage=mvp");
  });
});
