export const MARKET_LOCALE = "ru-RU";
export const MARKET_CURRENCY = "RUB";

const marketCurrencyFormatter = new Intl.NumberFormat(MARKET_LOCALE, {
  style: "currency",
  currency: MARKET_CURRENCY,
  maximumFractionDigits: 0,
});

export function formatMarketCurrency(value: number) {
  return marketCurrencyFormatter.format(value);
}

export function parseMarketNumber(value: string) {
  return Number(value.replace(/[\s,]/gu, ""));
}

export function russianPlural(value: number, one: string, few: string, many: string) {
  const absolute = Math.abs(value) % 100;
  const lastDigit = absolute % 10;

  if (absolute > 10 && absolute < 20) return many;
  if (lastDigit === 1) return one;
  if (lastDigit >= 2 && lastDigit <= 4) return few;
  return many;
}
