import { describe, expect, it } from "vitest";
import { pageCount, pageRange, parsePage } from "../lib/pagination";

describe("pagination helpers", () => {
  it("normalizes untrusted page parameters", () => {
    expect(parsePage("2")).toBe(2);
    expect(parsePage(["4", "5"])).toBe(4);
    expect(parsePage("-1")).toBe(1);
    expect(parsePage("1.5")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });

  it("calculates inclusive Supabase ranges and page totals", () => {
    expect(pageRange(3, 20)).toEqual({ from: 40, to: 59 });
    expect(pageCount(0, 20)).toBe(0);
    expect(pageCount(41, 20)).toBe(3);
  });
});
