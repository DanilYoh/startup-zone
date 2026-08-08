import { describe, expect, it } from "vitest";
import { isProtectedPathname } from "../lib/routing";

describe("isProtectedPathname", () => {
  it("protects the dashboard route tree", () => {
    expect(isProtectedPathname("/protected")).toBe(true);
    expect(isProtectedPathname("/protected/startups/new")).toBe(true);
  });

  it("keeps public discovery and similarly prefixed routes public", () => {
    expect(isProtectedPathname("/")).toBe(false);
    expect(isProtectedPathname("/startups")).toBe(false);
    expect(isProtectedPathname("/startups/climate-lens")).toBe(false);
    expect(isProtectedPathname("/protectedness")).toBe(false);
  });
});
