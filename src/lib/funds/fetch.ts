import "server-only";
import { cacheLife } from "next/cache";
import type { QuoteMap } from "@/lib/quotes/types";
import { isFundId, parseFundDetail, parseFundList, STARTAMARKETS_FUNDS_URL, type FundSummary } from "./startamarkets";

const REQUEST_TIMEOUT_MS = 8000;
const REQUEST_HEADERS = { Accept: "application/json", "User-Agent": "InvestingPlanner/1.0 (personal portfolio tracker)" };

export type FundQuotes = { quotes: QuoteMap; failedCount: number };

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: REQUEST_HEADERS, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`startamarkets responded ${response.status}`);
  return response.json();
}

async function fetchFundQuoteCached(fundId: string) {
  "use cache";
  cacheLife({ stale: 1800, revalidate: 21600, expire: 86400 });
  const quote = parseFundDetail(await getJson(`${STARTAMARKETS_FUNDS_URL}/${fundId}`));
  if (!quote) throw new Error(`No EGP price for fund ${fundId}`);
  return quote;
}

async function fetchFundListCached(): Promise<FundSummary[]> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 43200, expire: 172800 });
  const funds = parseFundList(await getJson(STARTAMARKETS_FUNDS_URL));
  if (funds.length === 0) throw new Error("Fund list was empty");
  return funds;
}

export async function loadFundQuotes(fundIds: readonly string[]): Promise<FundQuotes> {
  const ids = [...new Set(fundIds.filter(isFundId))].toSorted();
  const results = await Promise.allSettled(ids.map(fetchFundQuoteCached));
  const failures = results.filter((result) => result.status === "rejected");
  failures.forEach((failure) => console.error(`Fetching fund price failed: ${String((failure as PromiseRejectedResult).reason)}`));
  const quotes = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  return { quotes: Object.fromEntries(quotes.map((quote) => [quote.symbol, quote])), failedCount: failures.length };
}

export async function loadFundList(): Promise<FundSummary[] | null> {
  try {
    return await fetchFundListCached();
  } catch (error) {
    console.error(`Fetching fund list failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}
