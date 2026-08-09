import {
  formatMarketCurrency,
  MARKET_CURRENCY,
  MARKET_LOCALE,
  parseMarketNumber,
  russianPlural,
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

  it("uses the correct Russian plural form", () => {
    expect(russianPlural(1, "заявка", "заявки", "заявок")).toBe("заявка");
    expect(russianPlural(2, "заявка", "заявки", "заявок")).toBe("заявки");
    expect(russianPlural(5, "заявка", "заявки", "заявок")).toBe("заявок");
    expect(russianPlural(11, "заявка", "заявки", "заявок")).toBe("заявок");
    expect(russianPlural(21, "заявка", "заявки", "заявок")).toBe("заявка");
  });
});
