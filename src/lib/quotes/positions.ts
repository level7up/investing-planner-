import { roundMoney } from "@/lib/trades/calc";
import { riskProfile } from "@/lib/trades/risk";
import { isFundAsset, type Trade } from "@/lib/trades/types";
import { fundQuoteKey } from "@/lib/funds/startamarkets";
import type { Quote, QuoteMap } from "./types";

export type PositionAlert = "stop" | "target" | null;

export type LivePosition = {
  price: number;
  changePercent: number | null;
  asOf: string | null;
  isManual: boolean;
  marketValue: number;
  unrealised: number;
  unrealisedR: number | null;
  toStopPercent: number | null;
  toTargetPercent: number | null;
  alert: PositionAlert;
};

export type OpenUnrealised = { amount: number; pricedCount: number; openCount: number };

const manualQuote = (trade: Trade, price: number): Quote => ({
  symbol: trade.symbol,
  price,
  changePercent: null,
  asOf: trade.manualPriceDate,
});

export function quoteFor(trade: Trade, quotes: QuoteMap): Quote | null {
  if (trade.manualPrice !== null) return manualQuote(trade, trade.manualPrice);
  if (isFundAsset(trade.assetType)) return trade.fundId ? (quotes[fundQuoteKey(trade.fundId)] ?? null) : null;
  return quotes[trade.symbol.toUpperCase()] ?? null;
}

const percentFrom = (base: number, other: number): number => roundMoney(((other - base) / base) * 100);

function alertFor(price: number, trade: Trade): PositionAlert {
  if (trade.stopLoss !== null && price <= trade.stopLoss) return "stop";
  if (trade.targetPrice !== null && price >= trade.targetPrice) return "target";
  return null;
}

export function livePosition(trade: Trade, quotes: QuoteMap): LivePosition | null {
  const quote = quoteFor(trade, quotes);
  if (trade.status !== "open" || quote === null) return null;
  const { price } = quote;
  const unrealised = roundMoney((price - trade.buyPrice) * trade.quantity - trade.fees);
  const { riskAmount } = riskProfile(trade);
  return {
    price,
    changePercent: quote.changePercent,
    asOf: quote.asOf ?? null,
    isManual: trade.manualPrice !== null,
    marketValue: roundMoney(price * trade.quantity),
    unrealised,
    unrealisedR: riskAmount === null ? null : roundMoney(unrealised / riskAmount),
    toStopPercent: trade.stopLoss === null ? null : -percentFrom(price, trade.stopLoss),
    toTargetPercent: trade.targetPrice === null ? null : percentFrom(price, trade.targetPrice),
    alert: alertFor(price, trade),
  };
}

export function openMarketValue(trade: Trade, quotes: QuoteMap): number {
  const quote = quoteFor(trade, quotes);
  return roundMoney((quote?.price ?? trade.buyPrice) * trade.quantity);
}

export function openUnrealised(trades: readonly Trade[], quotes: QuoteMap): OpenUnrealised {
  const open = trades.filter((trade) => trade.status === "open");
  const positions = open.map((trade) => livePosition(trade, quotes)).filter((p): p is LivePosition => p !== null);
  return {
    amount: roundMoney(positions.reduce((sum, position) => sum + position.unrealised, 0)),
    pricedCount: positions.length,
    openCount: open.length,
  };
}
