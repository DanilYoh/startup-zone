import { describe, expect, it } from "vitest";
import { getSafeAuthRedirectPath, isProtectedPathname } from "../lib/routing";

describe("isProtectedPathname", () => {
  it("protects the dashboard route tree", () => {
    expect(isProtectedPathname("/protected")).toBe(true);
    expect(isProtectedPathname("/protected/startups/new")).toBe(true);
    expect(isProtectedPathname("/dashboard")).toBe(true);
    expect(isProtectedPathname("/dashboard/profile")).toBe(true);
  });

  it("keeps public discovery and similarly prefixed routes public", () => {
    expect(isProtectedPathname("/")).toBe(false);
    expect(isProtectedPathname("/startups")).toBe(false);
    expect(isProtectedPathname("/startups/climate-lens")).toBe(false);
    expect(isProtectedPathname("/protectedness")).toBe(false);
    expect(isProtectedPathname("/dashboard-preview")).toBe(false);
  });
});

describe("getSafeAuthRedirectPath", () => {
  it("allows only the local destinations used by auth flows", () => {
    expect(getSafeAuthRedirectPath("/protected")).toBe("/protected");
    expect(getSafeAuthRedirectPath("/dashboard/profile")).toBe(
      "/dashboard/profile",
    );
    expect(getSafeAuthRedirectPath("/auth/update-password")).toBe(
      "/auth/update-password",
    );
  });

  it("falls back to home for external, protocol-relative, or unknown paths", () => {
    expect(getSafeAuthRedirectPath("https://phishing.example/reset")).toBe("/");
    expect(getSafeAuthRedirectPath("//phishing.example/reset")).toBe("/");
    expect(getSafeAuthRedirectPath("/protectedness")).toBe("/");
    expect(getSafeAuthRedirectPath(null)).toBe("/");
  });
});
