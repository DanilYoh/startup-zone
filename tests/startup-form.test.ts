import { describe, expect, it } from "vitest";
import { parseStartupForm } from "../lib/startup-form";

function validFormData() {
  const formData = new FormData();
  formData.set("title", "Climate Lens");
  formData.set("slug", "climate-lens");
  formData.set("one_pager", "Actionable climate analytics for logistics teams.");
  formData.set(
    "description",
    "A decision-support platform that helps logistics teams model emissions, compare routes, and reduce operating costs.",
  );
  formData.set("stage", "mvp");
  formData.set("niche", "ClimateTech, B2B SaaS");
  formData.set("funding_ask", "250000");
  formData.set("equity_offered", "8");
  formData.set("deck_url", "");
  formData.set("website_url", "https://example.com");
  return formData;
}

describe("parseStartupForm", () => {
  it("normalizes numbers, niches, and empty optional URLs", () => {
    const result = parseStartupForm(validFormData());

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toMatchObject({
      niche: ["ClimateTech", "B2B SaaS"],
      funding_ask: 250_000,
      equity_offered: 8,
      deck_url: undefined,
    });
  });

  it("rejects malformed optional numbers", () => {
    const formData = validFormData();
    formData.set("funding_ask", "not-a-number");

    expect(parseStartupForm(formData).success).toBe(false);
  });

  it("rejects repeated scalar fields instead of silently choosing one", () => {
    const formData = validFormData();
    formData.append("title", "A second title");

    const result = parseStartupForm(formData);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.title).toBeDefined();
  });

  it("allows optional numbers and URLs to be omitted or left blank", () => {
    const formData = validFormData();
    formData.delete("funding_ask");
    formData.set("equity_offered", "");
    formData.delete("deck_url");
    formData.delete("website_url");

    expect(parseStartupForm(formData).success).toBe(true);
  });

  it("rejects repeated optional values", () => {
    const formData = validFormData();
    formData.append("funding_ask", "300000");
    formData.append("deck_url", "https://example.com/other-deck");

    expect(parseStartupForm(formData).success).toBe(false);
  });

  it("rejects uploaded files in text-only fields", () => {
    const formData = validFormData();
    formData.set("niche", new Blob(["ClimateTech"]), "niches.txt");

    expect(parseStartupForm(formData).success).toBe(false);
  });
});
