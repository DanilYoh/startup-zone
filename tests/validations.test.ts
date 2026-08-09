import { describe, expect, it } from "vitest";
import { startupSchema } from "../lib/validations";

const validStartup = {
  title: "Climate Lens",
  slug: "climate-lens",
  one_pager: "Actionable climate analytics for logistics teams.",
  description:
    "A decision-support platform that helps logistics teams model emissions, compare routes, and reduce operating costs.",
  stage: "mvp" as const,
  niche: ["ClimateTech", "B2B SaaS"],
  funding_ask: 250_000,
  equity_offered: 8,
  deck_url: "https://example.com/deck",
  website_url: "https://example.com",
};

describe("startupSchema", () => {
  it("accepts a complete startup proposal", () => {
    expect(startupSchema.safeParse(validStartup).success).toBe(true);
  });

  it("rejects unsafe or unreadable slugs", () => {
    const result = startupSchema.safeParse({ ...validStartup, slug: "Climate Lens!" });
    expect(result.success).toBe(false);
  });

  it("rejects equity values above 100 percent", () => {
    const result = startupSchema.safeParse({ ...validStartup, equity_offered: 101 });
    expect(result.success).toBe(false);
  });

  it("allows optional links to be left empty", () => {
    const result = startupSchema.safeParse({ ...validStartup, deck_url: "", website_url: "" });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate niches case-insensitively", () => {
    const result = startupSchema.safeParse({
      ...validStartup,
      niche: ["ClimateTech", "climatetech"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-HTTP startup links", () => {
    for (const links of [
      { website_url: "javascript:alert(1)" },
      { deck_url: "ftp://example.com/file" },
    ]) {
      const result = startupSchema.safeParse({ ...validStartup, ...links });
      expect(result.success).toBe(false);
    }
  });
});
