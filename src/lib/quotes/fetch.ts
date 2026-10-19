import "server-only";
import { cacheLife } from "next/cache";
import { buildScanRequest, normaliseSymbols, parseScanResponse, TRADINGVIEW_SCAN_URL } from "./tradingview";
import { EMPTY_SNAPSHOT, type QuoteMap, type QuoteSnapshot } from "./types";

const REQUEST_TIMEOUT_MS = 5000;
const QUOTE_STALE_SECONDS = 300;
const QUOTE_REVALIDATE_SECONDS = 900;
const QUOTE_EXPIRE_SECONDS = 3600;

async function fetchQuotesCached(symbols: string[]): Promise<{ quotes: QuoteMap; fetchedAt: string }> {
  "use cache";
  cacheLife({ stale: QUOTE_STALE_SECONDS, revalidate: QUOTE_REVALIDATE_SECONDS, expire: QUOTE_EXPIRE_SECONDS });

  const response = await fetch(TRADINGVIEW_SCAN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(buildScanRequest(symbols)),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`TradingView responded ${response.status}`);
  return { quotes: parseScanResponse(await response.json()), fetchedAt: new Date().toISOString() };
}

export async function loadQuotes(symbols: readonly string[]): Promise<QuoteSnapshot> {
  const normalised = normaliseSymbols(symbols);
  if (normalised.length === 0) return EMPTY_SNAPSHOT;
  try {
    return { ...(await fetchQuotesCached(normalised)), isAvailable: true };
  } catch (error) {
    console.error(`Fetching quotes failed: ${error instanceof Error ? error.message : String(error)}`);
    return { quotes: {}, fetchedAt: null, isAvailable: false };
  }
}
