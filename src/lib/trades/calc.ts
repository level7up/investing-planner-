import { TRADE_STATUSES, type Trade, type TradeFilter, type TradeFormValues } from "./types";

export type TradeMetrics = {
  total: number;
  net: number;
  winRate: number | null;
  openCapital: number;
};

export type StatusCounts = Record<TradeFilter, number>;

type PreviewValues = Pick<TradeFormValues, "status" | "buyPrice" | "quantity" | "sellPrice" | "fees">;

export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const profit = (buy: number, sell: number, quantity: number, fees: number): number =>
  roundMoney((sell - buy) * quantity - fees);

export function pnl(trade: Trade): number | null {
  if (trade.status !== "closed" || trade.sellPrice === null) return null;
  return profit(trade.buyPrice, trade.sellPrice, trade.quantity, trade.fees);
}

export function purchaseValue(trade: Trade): number {
  return roundMoney(trade.buyPrice * trade.quantity);
}

export function previewPnl(values: PreviewValues): number | null {
  const buy = Number(values.buyPrice);
  const quantity = Number(values.quantity);
  const isComplete = values.status === "closed" && values.sellPrice.trim() !== "" && buy > 0 && quantity > 0;
  if (!isComplete) return null;
  return profit(buy, Number(values.sellPrice), quantity, Number(values.fees) || 0);
}

export function computeMetrics(trades: readonly Trade[]): TradeMetrics {
  const results = trades.map(pnl).filter((value): value is number => value !== null);
  const wins = results.filter((value) => value > 0).length;
  const openCapital = trades
    .filter((trade) => trade.status === "open")
    .reduce((sum, trade) => sum + trade.buyPrice * trade.quantity, 0);
  return {
    total: trades.length,
    net: roundMoney(results.reduce((sum, value) => sum + value, 0)),
    winRate: results.length ? Math.round((wins / results.length) * 100) : null,
    openCapital: roundMoney(openCapital),
  };
}

export function countByStatus(trades: readonly Trade[]): StatusCounts {
  const counts = Object.fromEntries(
    TRADE_STATUSES.map((status) => [status, trades.filter((trade) => trade.status === status).length]),
  ) as Record<Trade["status"], number>;
  return { all: trades.length, ...counts };
}

const newestFirst = (a: Trade, b: Trade): number =>
  b.entryDate.localeCompare(a.entryDate) || b.updatedAt.localeCompare(a.updatedAt);

export function filterTrades(trades: readonly Trade[], query: string, filter: TradeFilter): Trade[] {
  const needle = query.trim().toLowerCase();
  return trades
    .filter((trade) => !needle || trade.symbol.toLowerCase().includes(needle))
    .filter((trade) => filter === "all" || trade.status === filter)
    .toSorted(newestFirst);
}
