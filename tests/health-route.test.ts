import { GET } from "@/app/healthz/route";
import { describe, expect, it } from "vitest";

describe("health route", () => {
  it("returns a non-cacheable liveness response", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
