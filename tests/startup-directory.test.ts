import { describe, expect, it } from "vitest";
import {
  hasStartupDirectoryFilters,
  parseStartupDirectoryFilters,
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
    });
  });

  it("ignores unsupported and oversized values", () => {
    expect(
      parseStartupDirectoryFilters({
        q: "q".repeat(81),
        stage: "not-a-stage",
        niche: "n".repeat(41),
      }),
    ).toEqual({ query: undefined, stage: undefined, niche: undefined });
  });

  it("uses the first value when a query parameter is repeated", () => {
    expect(parseStartupDirectoryFilters({ stage: ["seed", "idea"] }).stage).toBe("seed");
  });
});

describe("startup directory query helpers", () => {
  it("detects active filters", () => {
    expect(hasStartupDirectoryFilters({})).toBe(false);
    expect(hasStartupDirectoryFilters({ niche: "SaaS" })).toBe(true);
  });

  it("escapes SQL LIKE wildcard characters", () => {
    expect(toIlikePattern("50%_growth\\path")).toBe("%50\\%\\_growth\\\\path%");
  });
});
