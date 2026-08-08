import { describe, expect, it } from "vitest";
import { applicationSchema, parseApplicationForm } from "../features/applications/schemas";

describe("applicationSchema", () => {
  it("normalizes a valid application", () => {
    expect(
      applicationSchema.parse({
        startup_id: "42",
        message: "  I can help this team deliver the first release.  ",
      }),
    ).toEqual({
      startup_id: 42,
      message: "I can help this team deliver the first release.",
    });
  });

  it("rejects short messages and invalid startup ids", () => {
    expect(applicationSchema.safeParse({ startup_id: "other", message: "Too short" }).success).toBe(
      false,
    );
  });

  it("rejects repeated FormData values", () => {
    const formData = new FormData();
    formData.set("startup_id", "1");
    formData.append("startup_id", "2");
    formData.set("message", "A sufficiently detailed application message.");

    expect(parseApplicationForm(formData).success).toBe(false);
  });
});

