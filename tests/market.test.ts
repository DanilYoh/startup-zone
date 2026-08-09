import {
  formatMarketCurrency,
  MARKET_CURRENCY,
  MARKET_LOCALE,
  parseMarketNumber,
} from "@/lib/market";
import { describe, expect, it } from "vitest";

describe("Russian market defaults", () => {
  it("formats whole-ruble investment values for the Russian locale", () => {
    expect(MARKET_LOCALE).toBe("ru-RU");
    expect(MARKET_CURRENCY).toBe("RUB");
    expect(formatMarketCurrency(250_000)).toMatch(/^250[\s\u00a0]000[\s\u00a0]₽$/u);
  });

  it("accepts Russian or legacy grouping separators from number inputs", () => {
    expect(parseMarketNumber("250 000")).toBe(250_000);
    expect(parseMarketNumber("250\u00a0000")).toBe(250_000);
    expect(parseMarketNumber("250,000")).toBe(250_000);
  });
});
