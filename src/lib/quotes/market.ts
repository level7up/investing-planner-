import "server-only";
import { loadFundQuotes } from "@/lib/funds/fetch";
import { isFundAsset, type Trade } from "@/lib/trades/types";
import { loadQuotes } from "./fetch";
import type { QuoteSnapshot } from "./types";

export async function loadMarket(trades: readonly Trade[]): Promise<QuoteSnapshot> {
  const open = trades.filter((trade) => trade.status === "open");
  const stockSymbols = open.filter((trade) => !isFundAsset(trade.assetType)).map((trade) => trade.symbol);
  const fundIds = open.flatMap((trade) => (isFundAsset(trade.assetType) && trade.fundId ? [trade.fundId] : []));
  const [stocks, funds] = await Promise.all([loadQuotes(stockSymbols), loadFundQuotes(fundIds)]);
  return {
    quotes: { ...stocks.quotes, ...funds.quotes },
    fetchedAt: stocks.fetchedAt ?? (fundIds.length ? new Date().toISOString() : null),
    isAvailable: stocks.isAvailable && funds.failedCount === 0,
  };
}
