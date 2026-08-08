import { describe, expect, it } from "vitest";
import { profileSchema } from "../features/profiles/schemas";

describe("profileSchema", () => {
  it("normalizes optional profile fields", () => {
    const result = profileSchema.safeParse({
      full_name: "  Taylor Jordan  ",
      bio: " ",
      location: "Yekaterinburg",
      avatar_url: "",
      linkedin_url: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        full_name: "Taylor Jordan",
        bio: null,
        location: "Yekaterinburg",
        avatar_url: null,
        linkedin_url: null,
      });
    }
  });

  it("accepts safe avatar and LinkedIn URLs", () => {
    expect(
      profileSchema.safeParse({
        full_name: "Taylor Jordan",
        bio: "Marketplace specialist",
        location: "Remote",
        avatar_url: "https://images.example.test/avatar.png",
        linkedin_url: "https://www.linkedin.com/in/taylor-jordan",
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
      }).success,
    ).toBe(false);
  });
});

