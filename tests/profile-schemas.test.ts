import { describe, expect, it } from "vitest";
import { profileContactSchema, profileSchema } from "../features/profiles/schemas";

const emptyRoleFields = {
  headline: "",
  founder_experience: "",
  investor_organization: "",
  investment_thesis: "",
  preferred_stages: [],
  ticket_min: "",
  ticket_max: "",
  website_url: "",
};

describe("profileSchema", () => {
  it("normalizes optional profile fields", () => {
    const result = profileSchema.safeParse({
      full_name: "  Taylor Jordan  ",
      bio: " ",
      location: "Yekaterinburg",
      avatar_url: "",
      linkedin_url: "",
      ...emptyRoleFields,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        full_name: "Taylor Jordan",
        headline: null,
        bio: null,
        location: "Yekaterinburg",
        avatar_url: null,
        linkedin_url: null,
        founder_experience: null,
        investor_organization: null,
        investment_thesis: null,
        preferred_stages: [],
        ticket_min: null,
        ticket_max: null,
        website_url: null,
      });
    }
  });

  it("accepts safe avatar and LinkedIn URLs", () => {
    expect(
      profileSchema.safeParse({
        full_name: "Taylor Jordan",
        bio: "Early-stage marketplace investor",
        location: "Remote",
        avatar_url: "https://images.example.test/avatar.png",
        linkedin_url: "https://www.linkedin.com/in/taylor-jordan",
        ...emptyRoleFields,
      }).success,
    ).toBe(true);
  });

  it.each([
    ["javascript:alert(1)", "https://www.linkedin.com/in/taylor"],
    ["https://images.example.test/avatar.png", "http://linkedin.com/in/taylor"],
    ["https://images.example.test/avatar.png", "https://linkedin.example.com/in/taylor"],
  ])("rejects unsafe profile links", (avatarUrl, linkedinUrl) => {
    expect(
      profileSchema.safeParse({
        full_name: "Taylor Jordan",
        bio: "",
        location: "",
        avatar_url: avatarUrl,
        linkedin_url: linkedinUrl,
        ...emptyRoleFields,
      }).success,
    ).toBe(false);
  });

  it("normalizes an investor mandate and validates its ticket range", () => {
    const result = profileSchema.safeParse({
      full_name: "Taylor Jordan",
      headline: "Seed investor",
      bio: "Focused on vertical software.",
      location: "Remote",
      avatar_url: "",
      linkedin_url: "",
      founder_experience: "",
      investor_organization: "Northstar Ventures",
      investment_thesis: "Backing capital-efficient B2B software at pre-seed and seed.",
      preferred_stages: ["pre_seed", "seed"],
      ticket_min: "100,000",
      ticket_max: "500,000",
      website_url: "https://northstar.example.test",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ticket_min).toBe(100_000);
      expect(result.data.ticket_max).toBe(500_000);
      expect(result.data.preferred_stages).toEqual(["pre_seed", "seed"]);
    }

    expect(
      profileSchema.safeParse({
        ...emptyRoleFields,
        full_name: "Taylor Jordan",
        bio: "",
        location: "",
        avatar_url: "",
        linkedin_url: "",
        ticket_min: "500000",
        ticket_max: "100000",
      }).success,
    ).toBe(false);
  });

  it("accepts space-grouped ruble ticket values", () => {
    const result = profileSchema.safeParse({
      ...emptyRoleFields,
      full_name: "Taylor Jordan",
      bio: "",
      location: "",
      avatar_url: "",
      linkedin_url: "",
      ticket_min: "100 000",
      ticket_max: "500\u00a0000",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ticket_min).toBe(100_000);
      expect(result.data.ticket_max).toBe(500_000);
    }
  });
});

describe("profileContactSchema", () => {
  it("normalizes an enabled private contact", () => {
    const result = profileContactSchema.safeParse({
      contact_email: "  Founder@Example.Test ",
      contact_url: "https://t.me/startup_founder",
      sharing_enabled: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        contact_email: "founder@example.test",
        contact_url: "https://t.me/startup_founder",
        sharing_enabled: true,
      });
    }
  });

  it("requires a safe contact before sharing is enabled", () => {
    expect(
      profileContactSchema.safeParse({
        contact_email: "",
        contact_url: "",
        sharing_enabled: true,
      }).success,
    ).toBe(false);

    expect(
      profileContactSchema.safeParse({
        contact_email: "not-an-email",
        contact_url: "javascript:alert(1)",
        sharing_enabled: true,
      }).success,
    ).toBe(false);
  });

  it("allows details to be stored while future sharing is disabled", () => {
    expect(
      profileContactSchema.safeParse({
        contact_email: "",
        contact_url: "",
        sharing_enabled: false,
      }).success,
    ).toBe(true);
  });
});
