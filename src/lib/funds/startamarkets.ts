import { z } from "zod";
import type { Quote } from "@/lib/quotes/types";

export const STARTAMARKETS_FUNDS_URL = "https://startamarkets.com/api/v1/funds";

const FUND_ID = /^\d{1,10}$/;
const FUND_QUOTE_PREFIX = "FUND:";
const SUPPORTED_CURRENCY = "EGP";

export type FundSummary = {
  id: string;
  nameAr: string;
  nameEn: string;
  manager: string;
  classification: string | null;
  nav: number;
  navDate: string | null;
};

const nullableText = z.string().nullish().transform((value) => value ?? null);

const fundRecordSchema = z.object({
  fund_id: z.union([z.string(), z.number()]).transform(String),
  fund_name: nullableText,
  fund_name_en: nullableText,
  display_name_ar: nullableText,
  display_name_en: nullableText,
  manager_name_en: nullableText,
  currency: nullableText,
  latest_nav: z.union([z.string(), z.number()]).nullish(),
  last_nav_date: nullableText,
  last_updated: nullableText,
  classification: nullableText,
});

type FundRecord = z.infer<typeof fundRecordSchema>;

export const isFundId = (value: string): boolean => FUND_ID.test(value);

export const fundQuoteKey = (fundId: string): string => `${FUND_QUOTE_PREFIX}${fundId}`;

const toPositiveNumber = (value: FundRecord["latest_nav"]): number | null => {
  const number = Number(value);
  return value != null && Number.isFinite(number) && number > 0 ? number : null;
};

const toDate = (value: string | null): string | null => (value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null);

function toSummary(input: unknown): FundSummary | null {
  const parsed = fundRecordSchema.safeParse(input);
  if (!parsed.success) return null;
  const record = parsed.data;
  const nav = toPositiveNumber(record.latest_nav);
  if (!isFundId(record.fund_id) || nav === null || record.currency !== SUPPORTED_CURRENCY) return null;
  return {
    id: record.fund_id,
    nameAr: record.display_name_ar ?? record.fund_name ?? record.fund_id,
    nameEn: record.display_name_en ?? record.fund_name_en ?? record.fund_id,
    manager: record.manager_name_en ?? "",
    classification: record.classification,
    nav,
    navDate: toDate(record.last_nav_date) ?? toDate(record.last_updated),
  };
}

export function parseFundDetail(json: unknown): Quote | null {
  const summary = toSummary(json);
  if (!summary) return null;
  return { symbol: fundQuoteKey(summary.id), price: summary.nav, changePercent: null, asOf: summary.navDate };
}

export function parseFundList(json: unknown): FundSummary[] {
  if (!Array.isArray(json)) return [];
  return json.map(toSummary).filter((fund): fund is FundSummary => fund !== null);
}

const haystack = (fund: FundSummary): string => `${fund.nameAr} ${fund.nameEn} ${fund.manager}`.toLowerCase();

export function searchFunds(funds: readonly FundSummary[], query: string, limit: number): FundSummary[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return funds.filter((fund) => words.every((word) => haystack(fund).includes(word))).slice(0, limit);
}
