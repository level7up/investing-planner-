import { z } from "zod";
import type { Quote, QuoteMap } from "./types";

export const TRADINGVIEW_SCAN_URL = "https://scanner.tradingview.com/egypt/scan";

const EXCHANGE_PREFIX = "EGX:";
const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,19}$/;

export type ScanRequest = {
  symbols: { tickers: string[] };
  columns: ["close", "change"];
};

const scanResponseSchema = z.object({
  data: z.array(z.object({ s: z.string(), d: z.array(z.unknown()) })),
});

const isPositiveNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

const finiteOrNull = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

export function normaliseSymbols(symbols: readonly string[]): string[] {
  const cleaned = symbols.map((symbol) => symbol.trim().toUpperCase()).filter((symbol) => SYMBOL_PATTERN.test(symbol));
  return [...new Set(cleaned)].toSorted();
}

export function buildScanRequest(symbols: readonly string[]): ScanRequest {
  return { symbols: { tickers: symbols.map((symbol) => `${EXCHANGE_PREFIX}${symbol}`) }, columns: ["close", "change"] };
}

function toQuote(row: { s: string; d: unknown[] }): Quote | null {
  const [price, change] = row.d;
  if (!isPositiveNumber(price)) return null;
  const symbol = row.s.startsWith(EXCHANGE_PREFIX) ? row.s.slice(EXCHANGE_PREFIX.length) : row.s;
  return { symbol, price, changePercent: finiteOrNull(change) };
}

export function parseScanResponse(json: unknown): QuoteMap {
  const parsed = scanResponseSchema.safeParse(json);
  if (!parsed.success) return {};
  const quotes = parsed.data.data.map(toQuote).filter((quote): quote is Quote => quote !== null);
  return Object.fromEntries(quotes.map((quote) => [quote.symbol, quote]));
}
