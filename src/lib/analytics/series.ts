import { goldRealised, goldSummary } from "@/lib/gold/calc";
import type { GoldHolding } from "@/lib/gold/types";
import type { PortfolioSources } from "@/lib/portfolio/calc";
import { openMarketValue } from "@/lib/quotes/positions";
import { pnl, roundMoney } from "@/lib/trades/calc";
import type { AssetType, Trade } from "@/lib/trades/types";
import { cashBalance } from "@/lib/wallet/calc";

const OTHER_LABEL = "أخرى";

export type RealisedEvent = { date: string; amount: number; label: string };
export type CumulativePoint = { date: string; value: number; delta: number };
export type MonthTotal = { month: string; total: number };
export type SymbolTotal = { label: string; total: number; count: number };
export type AllocationKey = "cash" | "stocks" | "equityFunds" | "goldFunds" | "gold";
export type AllocationPart = { key: AllocationKey; label: string; value: number; share: number };

function tradeEvent(trade: Trade): RealisedEvent | null {
  const amount = pnl(trade);
  return amount === null ? null : { date: trade.exitDate ?? trade.entryDate, amount, label: trade.symbol };
}

function goldEvent(holding: GoldHolding): RealisedEvent | null {
  const amount = goldRealised(holding);
  if (amount === null) return null;
  return { date: holding.soldDate ?? holding.purchaseDate, amount, label: `ذهب عيار ${holding.karat}` };
}

export function realisedEvents(trades: readonly Trade[], gold: readonly GoldHolding[]): RealisedEvent[] {
  const events = [...trades.map(tradeEvent), ...gold.map(goldEvent)].filter((e): e is RealisedEvent => e !== null);
  return events.toSorted((a, b) => a.date.localeCompare(b.date));
}

export function cumulativeSeries(events: readonly RealisedEvent[]): CumulativePoint[] {
  const byDate = events.reduce<Map<string, number>>((map, e) => new Map(map).set(e.date, (map.get(e.date) ?? 0) + e.amount), new Map());
  const dates = [...byDate.keys()].toSorted();
  return dates.reduce<CumulativePoint[]>((points, date) => {
    const delta = roundMoney(byDate.get(date) ?? 0);
    const value = roundMoney((points.at(-1)?.value ?? 0) + delta);
    return [...points, { date, value, delta }];
  }, []);
}

const nextMonth = (month: string): string => {
  const [year, monthNumber] = month.split("-").map(Number);
  return monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, "0")}`;
};

function monthRange(first: string, last: string): string[] {
  const months = [first];
  while (months.at(-1)! < last) months.push(nextMonth(months.at(-1)!));
  return months;
}

export function monthlyTotals(events: readonly RealisedEvent[]): MonthTotal[] {
  if (events.length === 0) return [];
  const months = events.map((e) => e.date.slice(0, 7));
  const range = monthRange(months.toSorted()[0], months.toSorted().at(-1)!);
  return range.map((month) => ({
    month,
    total: roundMoney(events.filter((e) => e.date.startsWith(month)).reduce((sum, e) => sum + e.amount, 0)),
  }));
}

export function pnlBySymbol(trades: readonly Trade[], limit: number): SymbolTotal[] {
  const totals = trades.reduce<Map<string, SymbolTotal>>((map, trade) => {
    const amount = pnl(trade);
    if (amount === null) return map;
    const current = map.get(trade.symbol) ?? { label: trade.symbol, total: 0, count: 0 };
    return new Map(map).set(trade.symbol, { ...current, total: roundMoney(current.total + amount), count: current.count + 1 });
  }, new Map());
  const ranked = [...totals.values()].toSorted((a, b) => b.total - a.total);
  if (ranked.length <= limit) return ranked;
  const tail = ranked.slice(limit);
  const other = { label: OTHER_LABEL, total: roundMoney(tail.reduce((sum, s) => sum + s.total, 0)), count: tail.reduce((sum, s) => sum + s.count, 0) };
  return [...ranked.slice(0, limit), other];
}

function openValue(sources: PortfolioSources, assetType: AssetType): number {
  return roundMoney(
    sources.trades
      .filter((trade) => trade.status === "open" && trade.assetType === assetType)
      .reduce((sum, trade) => sum + openMarketValue(trade, sources.quotes ?? {}), 0),
  );
}

export function allocation(sources: PortfolioSources): AllocationPart[] {
  const candidates: Omit<AllocationPart, "share">[] = [
    { key: "cash", label: "نقدية", value: Math.max(0, cashBalance(sources)) },
    { key: "stocks", label: "أسهم", value: openValue(sources, "stock") },
    { key: "equityFunds", label: "صناديق أسهم", value: openValue(sources, "equity_fund") },
    { key: "goldFunds", label: "صناديق ذهب", value: openValue(sources, "gold_fund") },
    { key: "gold", label: "ذهب", value: goldSummary(sources.gold, sources.prices).heldValue },
  ];
  const parts = candidates.filter((part) => part.value > 0);
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  return parts.map((part) => ({ ...part, share: Math.round((part.value / total) * 1000) / 10 }));
}

const NICE_STEPS = [1, 2, 5, 10];

function niceStep(rough: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  const step = NICE_STEPS.find((candidate) => normalised <= candidate * 1.5) ?? 10;
  return step * magnitude;
}

export function niceTicks(min: number, max: number, count: number): number[] {
  const low = Math.min(0, min);
  const high = Math.max(0, max);
  if (high === low) return [low, low + 1];
  const step = niceStep((high - low) / Math.max(1, count - 1));
  const first = Math.floor(low / step) * step;
  const last = Math.ceil(high / step) * step;
  return Array.from({ length: Math.round((last - first) / step) + 1 }, (_, index) => roundMoney(first + index * step));
}
