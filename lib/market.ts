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
