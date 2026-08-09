import { startupSchema } from "@/lib/validations";
import { parseMarketNumber } from "@/lib/market";

function singleValue(formData: FormData, name: string) {
  const values = formData.getAll(name);
  return values.length === 1 ? values[0] : null;
}

function optionalValue(formData: FormData, name: string) {
  const values = formData.getAll(name);
  if (values.length === 0) return undefined;
  return values.length === 1 ? values[0] : null;
}

function optionalNumber(formData: FormData, name: string) {
  const values = formData.getAll(name);

  if (values.length === 0) return undefined;
  if (values.length !== 1 || typeof values[0] !== "string") return Number.NaN;

  const value = values[0].trim();
  return value === "" ? undefined : parseMarketNumber(value);
}

function niches(formData: FormData) {
  const values = formData.getAll("niche");
  if (values.some((value) => typeof value !== "string")) return [""];

  return values
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseStartupForm(formData: FormData) {
  return startupSchema.safeParse({
    title: singleValue(formData, "title"),
    slug: singleValue(formData, "slug"),
    one_pager: singleValue(formData, "one_pager"),
    description: singleValue(formData, "description"),
    stage: singleValue(formData, "stage"),
    niche: niches(formData),
    funding_ask: optionalNumber(formData, "funding_ask"),
    equity_offered: optionalNumber(formData, "equity_offered"),
    deck_url: optionalValue(formData, "deck_url"),
    website_url: optionalValue(formData, "website_url"),
  });
}
